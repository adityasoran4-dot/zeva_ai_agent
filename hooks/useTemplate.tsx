import { getTokenByPath } from "@/lib/helper";
import { Template } from "@/types/templates";
import axios from "axios";
import { useEffect, useState } from "react";

const useTemplate = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<Template[]>([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState<Template[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<Template[]>([]);

  const token = getTokenByPath();

  useEffect(() => {
    const fetchAllTemplates = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/all-templates?limit=1000`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (data && data.success) {
          const templatesData: Template[] = data.templates || [];
          const smsTemplates = templatesData?.filter(
            (t) => t?.templateType === "sms"
          );
          const whatsappTemplates = templatesData?.filter(
            (t) => t?.templateType === "whatsapp" && t?.status === "approved"
          );
          const emailTemplates = templatesData?.filter(
            (t) => t?.templateType === "email" && t?.status === "approved"
          );

          setSmsTemplates(smsTemplates);
          setWhatsappTemplates(whatsappTemplates);
          setEmailTemplates(emailTemplates);
          setTemplates(templatesData);
        }
      } catch (error: any) {
        console.log("Error in fetch templates: ", error?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllTemplates();
  }, []);
  return {
    smsTemplates,
    whatsappTemplates,
    emailTemplates,
    templates,
    loading,
  };
};

export default useTemplate;
