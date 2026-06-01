import React from "react";
import { useRouter } from "next/router";
import { 
  Building2, 
  Stethoscope, 
  Waves, 
  Heart,
  Clock,
  ArrowRight
} from "lucide-react";

type CardType = "clinic" | "doctor" | "spa" | "wellness";

interface SearchCardsProps {
  hideCards?: CardType[]; // Cards to hide
  onCardClick?: (type: CardType) => void; // Optional external handler
}

const cardData: {
  type: CardType;
  label: string;
  comingSoon?: boolean;
  route: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  description: string;
  bgImage: string;
}[] = [
  { 
    type: "clinic", 
    label: "Search Clinic", 
    route: "/", 
    icon: Building2,
    gradient: "from-[#2D9AA5]/90 to-[#238a94]/90",
    description: "Find medical clinics near you",
    bgImage: "https://www.shutterstock.com/shutterstock/videos/3726842021/thumb/10.jpg?ip=x480"
  },
  { 
    type: "doctor", 
    label: "Search Doctor", 
    route: "/doctor/search", 
    icon: Stethoscope,
    gradient: "from-[#2D9AA5]/90 to-[#1e7278]/90",
    description: "Connect with healthcare professionals",
    bgImage: "https://investin.org/cdn/shop/articles/jafar-ahmed-E285pJbC4uE-unsplash.jpg?v=1634293259"
  },
  { 
    type: "spa", 
    label: "Search Spa", 
    comingSoon: true, 
    route: "/spa", 
    icon: Waves,
    gradient: "from-[#2D9AA5]/90 to-[#4db3bd]/90",
    description: "Relax and rejuvenate yourself",
    bgImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&h=300&fit=crop&auto=format"
  },
  { 
    type: "wellness", 
    label: "Search Wellness Center", 
    comingSoon: true, 
    route: "/wellness", 
    icon: Heart,
    gradient: "from-[#2D9AA5]/90 to-[#52c4d0]/90",
    description: "Complete wellness solutions",
    bgImage: "https://www.opsisarch.com/wp-content/uploads//2020/05/Western-Oregon-University-Health-Wellness-Center-Multiuse-Exercise-Studio-Yoga-Opsis-Architecture.jpg"
  },
];

const SearchCards: React.FC<SearchCardsProps> = ({ hideCards = [], onCardClick }) => {
  const router = useRouter();

  const handleClick = (card: typeof cardData[0]) => {
    if (card.comingSoon) return;

    // Call external handler if provided
    if (onCardClick) {
      onCardClick(card.type);
    }

    router.push(card.route);
  };

  return (
    <div className="flex justify-center p-4">
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
        {cardData
          .filter(card => !hideCards.includes(card.type))
          .map(card => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.type}
                onClick={() => handleClick(card)}
                className={`
                  relative group w-full h-32 sm:h-36 md:h-40 min-w-0
                  rounded-xl overflow-hidden 
                  border-2 border-transparent
                  shadow-md hover:shadow-xl
                  transform transition-all duration-300 ease-out
                  ${card.comingSoon 
                    ? "cursor-not-allowed opacity-75" 
                    : "cursor-pointer hover:scale-[1.02] hover:border-[#2D9AA5] hover:shadow-[#2D9AA5]/20"
                  }
                  ring-0 hover:ring-2 hover:ring-[#2D9AA5]/30
                  active:scale-[0.98] active:shadow-lg
                `}
              >
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('${card.bgImage}')`
                  }}
                >
                  {/* Image Overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30"></div>
                </div>

                {/* Coming Soon Badge - Always Visible */}
                {card.comingSoon && (
                  <div className="absolute top-2 right-2 z-30">
                    <div className="bg-yellow-400 text-yellow-800 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-lg border border-yellow-500">
                      <Clock size={10} />
                      <span>Soon</span>
                    </div>
                  </div>
                )}

                {/* Icon - Visible on Mobile, Hidden on Hover for Desktop */}
                <div className="absolute top-2 left-2 z-20 pointer-events-none lg:group-hover:opacity-0 transition-opacity duration-300">
                  <div className="bg-[#2D9AA5] rounded-lg p-2 shadow-lg">
                    <IconComponent 
                      size={20}
                      className="text-white" 
                    />
                  </div>
                </div>

                {/* Text Content - Always Visible on Mobile, Hover Reveal on Desktop */}
                <div className={`
                  absolute inset-0 z-10
                  bg-gradient-to-t ${card.gradient}
                  flex flex-col justify-end p-3
                  transition-all duration-300 ease-out
                  lg:opacity-0 lg:translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0
                  ${card.comingSoon ? 'lg:group-hover:opacity-70' : ''}
                `}>
                  <div className="text-white">
                    <h3 className="text-sm sm:text-base font-bold mb-1 leading-tight">
                      {card.label}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/90 mb-2 leading-snug line-clamp-2">
                      {card.description}
                    </p>
                    
                    {/* Action Button - Only show if not coming soon */}
                    {!card.comingSoon && (
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-xs sm:text-sm">
                          Click to explore
                        </span>
                        <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                          <ArrowRight 
                            size={12}
                            className="text-white transform group-hover:translate-x-0.5 transition-transform" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Disabled Overlay for Coming Soon */}
                {card.comingSoon && (
                  <div className="absolute inset-0 bg-black/40 z-25"></div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default SearchCards;

