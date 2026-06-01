import AllocatedStockItem from "../models/stocks/AllocatedStockItem";

export const getDividendArr = async (level0, packagingStructure) => {
  console.log({ level0, packagingStructure });
  if (!level0) {
    return [];
  }
  let dividendArr = [];
  if (level0?.uom && level0?.price) {
    dividendArr.push({
      uom: level0?.uom,
      mFactor: 1,
    });
  }
  if (
    packagingStructure?.level1?.uom &&
    packagingStructure?.level1?.price > 0 &&
    packagingStructure?.level1?.quantity > 0
  ) {
    dividendArr.push({
      uom: packagingStructure?.level1?.uom,
      mFactor: packagingStructure?.level1?.quantity,
    });
  }
  if (
    packagingStructure?.level2?.uom &&
    packagingStructure?.level2?.price > 0 &&
    packagingStructure?.level2?.quantity > 0
  ) {
    dividendArr.push({
      uom: packagingStructure?.level2?.uom,
      mFactor: packagingStructure?.level2?.quantity,
    });
  }

  return dividendArr;
};

export const reduceQuantity = async (
  quantities,
  targetUom,
  targetQty,
  level0,
  packagingStructure,
) => {
  let dividendArr = await getDividendArr(level0, packagingStructure);

  console.log({
    dividendArr,
    quantities,
    targetUom,
    targetQty,
    level0,
    packagingStructure,
  });
  if (dividendArr.length === 0) return quantities;

  // Copy array
  let updated = JSON.parse(JSON.stringify(quantities));

  // Find target index
  const targetIndex = dividendArr.findIndex((d) => d.uom === targetUom);
  if (targetIndex === -1) throw new Error("UOM not found");

  // Find target item
  const targetItem = updated.find((d) => d.uom === targetUom);
  if (!targetItem) throw new Error("Target UOM not in quantities");

  // Check if enough in target
  if (targetItem.quantity < targetQty) {
    throw new Error(`Only ${targetItem.quantity} ${targetUom} available`);
  }

  // Sabse pehle target UOM se reduce karo
  targetItem.quantity -= targetQty;

  // Ab upar wale UOMs (higher index) ko adjust karo
  // Target se upar wale UOMs pe jao (chote index)
  for (let i = targetIndex - 1; i >= 0; i--) {
    const higherUom = dividendArr[i].uom;
    const higherItem = updated.find((d) => d.uom === higherUom);
    if (!higherItem) continue;

    // Calculate factor: target se higher tak ke saare mFactors multiply karo
    let factor = 1;
    for (let j = i + 1; j <= targetIndex; j++) {
      factor *= dividendArr[j].mFactor;
    }

    // Higher UOM me se proportional quantity subtract karo
    const reduceFromHigher = targetQty / factor;
    higherItem.quantity -= reduceFromHigher;

    // // Check negative nahi hona chahiye
    // if (higherItem.quantity < 0) {
    //   throw new Error(`Insufficient ${higherUom} after adjustment`);
    // }
  }

  // Ab neeche wale UOMs (lower index) ko adjust karo
  for (let i = targetIndex + 1; i < dividendArr.length; i++) {
    const lowerUom = dividendArr[i].uom;
    const lowerItem = updated.find((d) => d.uom === lowerUom);
    if (!lowerItem) continue;

    // Calculate factor: target se lower tak ke saare mFactors multiply karo
    let factor = 1;
    for (let j = targetIndex + 1; j <= i; j++) {
      factor *= dividendArr[j].mFactor;
    }

    // Lower UOM me se proportional quantity subtract karo
    const reduceFromLower = targetQty * factor;
    lowerItem.quantity -= reduceFromLower;

    // Check negative nahi hona chahiye
    if (lowerItem.quantity < 0) {
      throw new Error(`Insufficient ${lowerUom} after adjustment`);
    }
  }

  // Round all quantities to 2 decimal places before returning
  updated = updated.map((item) => ({
    ...item,
    quantity: Math.round(item.quantity * 100) / 100,
  }));

  // Check if any quantity is less than 0, if so set all quantities to 0
  const hasNegativeQuantity = updated.some((item) => item.quantity <= 0);
  if (hasNegativeQuantity) {
    updated = updated.map((item) => ({
      ...item,
      quantity: 0,
    }));
  }

  return updated;
};

export const calculateTotalAmount = async (
  allocatedItemId,
  targetUom,
  targetQty,
) => {
  const allocatedItem = await AllocatedStockItem.findById(allocatedItemId);
  if (!allocatedItem) {
    throw new Error("Allocated stock item not found");
  }
  if (allocatedItem?.item?.level0?.uom === targetUom) {
    return allocatedItem?.item?.level0?.price * targetQty;
  }
  if (allocatedItem?.item?.packagingStructure?.level1?.uom === targetUom) {
    return allocatedItem?.item?.packagingStructure?.level1?.price * targetQty;
  }
  if (allocatedItem?.item?.packagingStructure?.level2?.uom === targetUom) {
    return allocatedItem?.item?.packagingStructure?.level2?.price * targetQty;
  }

  throw new Error("UOM not found");
};
