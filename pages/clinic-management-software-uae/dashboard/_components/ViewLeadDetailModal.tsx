import React from "react";
import {
  X,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Copy,
  CheckCircle2,
} from "lucide-react";

interface ZevaLead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  clinicName?: string;
  createdAt: string;
}

interface ViewLeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: ZevaLead | null;
}

const ViewLeadDetailModal: React.FC<ViewLeadDetailModalProps> = ({
  isOpen,
  onClose,
  lead,
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!isOpen || !lead) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-[#0A1F44] p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl font-bold shadow-lg">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{lead.name}</h2>
              <p className="text-blue-200 mt-1">Lead Details</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Contact Information */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Contact Information
            </h3>

            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">
                      Email Address
                    </p>
                    <p className="text-gray-900 font-semibold">{lead.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(lead.email, "email")}
                  className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-400 hover:text-blue-600"
                >
                  {copiedField === "email" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">
                      Phone Number
                    </p>
                    <p className="text-gray-900 font-semibold">{lead.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(lead.phone, "phone")}
                  className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-400 hover:text-emerald-600"
                >
                  {copiedField === "phone" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Business Details */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Business Details
            </h3>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Clinic Name</p>
                <p className="text-gray-900 font-semibold">
                  {lead.clinicName || "Not Provided"}
                </p>
              </div>
            </div>
          </section>

          {/* Submission Info */}
          <section className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(lead.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{formatTime(lead.createdAt)}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewLeadDetailModal;
