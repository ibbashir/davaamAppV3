 "use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Building2, MapPin, Cpu, DollarSign, Loader2 } from "lucide-react"
import { postRequest } from "@/Apis/Api"

interface CorporateFormData {
  corporate_name: string
  location: string
  topuplimit: string
  machine_codes: string[]
}

const CorporateRegisterForm = () => {
  const [formData, setFormData] = useState<CorporateFormData>({
    corporate_name: "",
    location: "",
    topuplimit: "",
    machine_codes: [""]
  })
  const [loading, setLoading] = useState(false)
  const [newMachineCode, setNewMachineCode] = useState("")

  const handleInputChange = (field: keyof CorporateFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addMachineCode = () => {
    if (newMachineCode.trim()) {
      setFormData(prev => ({
        ...prev,
        machine_codes: [...prev.machine_codes, newMachineCode.trim()]
      }))
      setNewMachineCode("")
    }
  }

  const removeMachineCode = (index: number) => {
    setFormData(prev => ({
      ...prev,
      machine_codes: prev.machine_codes.filter((_, i) => i !== index)
    }))
  }

  const handleMachineCodeInputChange = (index: number, value: string) => {
    const updatedCodes = [...formData.machine_codes]
    updatedCodes[index] = value
    setFormData(prev => ({
      ...prev,
      machine_codes: updatedCodes
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filter out empty machine codes
    const filteredMachineCodes = formData.machine_codes.filter(code => code.trim() !== "")
    
    if (filteredMachineCodes.length === 0) {
      alert("Please add at least one machine code")
      return
    }

    const submissionData = {
      corporate_name: formData.corporate_name.trim(),
      location: formData.location.trim(),
      topuplimit: formData.topuplimit,
      machine_codes: JSON.stringify(filteredMachineCodes) // Convert array to JSON string
    }

    console.log("Submitting data:", submissionData)

    setLoading(true)

    try {
      const response = await postRequest("/superadmin/corporateRegisteration", submissionData)
      // Assuming postRequest returns the response directly or the data
      if (response.status === 200 || response.status === 201) {
        alert("Corporate registered successfully!")
        
        // Reset form
        setFormData({
          corporate_name: "",
          location: "",
          topuplimit: "",
          machine_codes: [""]
        })
        setNewMachineCode("")
      } else {
        // Handle different response structures
        const errorData = response.data || response
        throw new Error(errorData.message || "Failed to register corporate")
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      alert(error?.message || "Failed to register corporate")
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = formData.corporate_name.trim() && 
                     formData.location.trim() && 
                     formData.topuplimit && 
                     formData.machine_codes.some(code => code.trim() !== "")

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Corporate Registration</h1>
        <p className="text-gray-600 mt-2">Register new corporate clients for top-up services</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Corporate Information
          </CardTitle>
          <CardDescription>
            Fill in the details below to register a new corporate client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Corporate Name */}
            <div className="space-y-2">
              <Label htmlFor="corporate_name" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Corporate Name *
              </Label>
              <Input
                id="corporate_name"
                placeholder="Enter corporate name"
                value={formData.corporate_name}
                onChange={(e) => handleInputChange("corporate_name", e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location *
              </Label>
              <Textarea
                id="location"
                placeholder="Enter corporate address or location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Top-up Limit */}
            <div className="space-y-2">
              <Label htmlFor="topuplimit" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Top-up Limit *
              </Label>
              <Input
                id="topuplimit"
                type="number"
                placeholder="Enter top-up limit amount"
                value={formData.topuplimit}
                onChange={(e) => handleInputChange("topuplimit", e.target.value)}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>

            {/* Machine Codes */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Machine Codes *
              </Label>
              
              {/* Existing Machine Codes */}
              <div className="space-y-2">
                {formData.machine_codes.map((code, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Machine code #${index + 1}`}
                      value={code}
                      onChange={(e) => handleMachineCodeInputChange(index, e.target.value)}
                      disabled={loading}
                    />
                    {formData.machine_codes.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeMachineCode(index)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Machine Code */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter new machine code"
                  value={newMachineCode}
                  onChange={(e) => setNewMachineCode(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addMachineCode()
                    }
                  }}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addMachineCode}
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              
              <p className="text-sm text-gray-500">
                Add all machine codes associated with this corporate client
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                size="lg"
                disabled={!isFormValid || loading}
                className="min-w-32"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Registering...
                  </>
                ) : (
                  "Register Corporate"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {isFormValid && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>This is how the data will be sent to API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Corporate Name:</strong> {formData.corporate_name}</p>
              <p><strong>Location:</strong> {formData.location}</p>
              <p><strong>Top-up Limit:</strong> ${parseFloat(formData.topuplimit).toLocaleString()}</p>
              <p><strong>Machine Codes:</strong> {JSON.stringify(formData.machine_codes.filter(code => code.trim()))}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CorporateRegisterForm