"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Building2,
  MapPin,
  Cpu,
  DollarSign,
  Loader2,
} from "lucide-react";
import { postRequest } from "@/Apis/Api";

interface CorporateFormData {
  corporate_name: string;
  location: string;
  topuplimit: string;
  machine_codes: string[];
}

interface CorporateRegisterFormProps {
  closeModal: () => void;
}

const CorporateRegisterForm: React.FC<CorporateRegisterFormProps> = ({
  closeModal,
}) => {
  const [formData, setFormData] = useState<CorporateFormData>({
    corporate_name: "",
    location: "",
    topuplimit: "",
    machine_codes: [""],
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof CorporateFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addMachineCode = () => {
    setFormData((prev) => ({
      ...prev,
      machine_codes: [...prev.machine_codes, ""],
    }));
  };

  const removeMachineCode = (index: number) => {
    if (formData.machine_codes.length === 1) {
      // Don't remove the last one, just clear it
      const updatedCodes = [...formData.machine_codes];
      updatedCodes[index] = "";
      setFormData((prev) => ({ ...prev, machine_codes: updatedCodes }));
    } else {
      setFormData((prev) => ({
        ...prev,
        machine_codes: prev.machine_codes.filter((_, i) => i !== index),
      }));
    }
  };

  const handleMachineCodeInputChange = (index: number, value: string) => {
    const updatedCodes = [...formData.machine_codes];
    updatedCodes[index] = value;
    setFormData((prev) => ({ ...prev, machine_codes: updatedCodes }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty machine codes
    const filteredCodes = formData.machine_codes.filter(
      (code) => code.trim() !== ""
    );

    if (filteredCodes.length === 0) {
      alert("Please add at least one machine code");
      return;
    }

    const submissionData = {
      corporate_name: formData.corporate_name.trim(),
      location: formData.location.trim(),
      topuplimit: formData.topuplimit,
      machine_codes: JSON.stringify(filteredCodes),
    };

    setLoading(true);
    try {
      const response: any = await postRequest(
        "/admin/corporateRegisteration",
        submissionData
      );

      console.log("Corporate Registration Response:", response);

      if (response?.success || response?.message?.toLowerCase()?.includes("success")) {
        alert("✅ Corporate registered successfully!");
        closeModal();
      } else {
        alert("❌ Failed to register corporate. Please try again.");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      alert(error?.message || "Error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.corporate_name.trim() &&
    formData.location.trim() &&
    formData.topuplimit &&
    formData.machine_codes.some((c) => c.trim() !== "");

  return (
    <Card className="border border-teal-200 shadow-sm max-h-[80vh] overflow-y-auto">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Corporate Name */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-gray-700 font-medium">
              <Building2 className="h-4 w-4 text-teal-600" />
              Corporate Name *
            </Label>
            <Input
              placeholder="Enter corporate name"
              value={formData.corporate_name}
              onChange={(e) =>
                handleInputChange("corporate_name", e.target.value)
              }
              disabled={loading}
              required
            />
          </div>

          {/* Location */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-gray-700 font-medium">
              <MapPin className="h-4 w-4 text-teal-600" />
              Location *
            </Label>
            <Textarea
              placeholder="Enter corporate address or location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Top-up Limit */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-gray-700 font-medium">
              <DollarSign className="h-4 w-4 text-teal-600" />
              Top-up Limit *
            </Label>
            <Input
              type="number"
              placeholder="Enter top-up limit"
              value={formData.topuplimit}
              onChange={(e) =>
                handleInputChange("topuplimit", e.target.value)
              }
              min="0"
              step="0.01"
              disabled={loading}
              required
            />
          </div>

          {/* Machine Codes */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-gray-700 font-medium">
              <Cpu className="h-4 w-4 text-teal-600" />
              Machine Codes *
            </Label>

            {formData.machine_codes.map((code, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder={`Machine code #${index + 1}`}
                  value={code}
                  onChange={(e) =>
                    handleMachineCodeInputChange(index, e.target.value)
                  }
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeMachineCode(index)}
                  disabled={loading}
                  className="border-red-200 hover:bg-red-50 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              onClick={addMachineCode}
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1 w-full"
            >
              <Plus className="h-4 w-4" /> Add Machine Code
            </Button>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={!isFormValid || loading}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Registering...
                </>
              ) : (
                "Register Corporate"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CorporateRegisterForm;