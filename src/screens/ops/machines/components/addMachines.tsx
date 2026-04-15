import { Fragment, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { Switch } from "@headlessui/react";
import { postRequest } from "@/Apis/Api";

type Inputs = {
  machine_code: string;
  machine_name: string;
  image: string;
  machine_location: string;
  machine_city:string;
  machine_type: string;
  variant_type: string;
  mapLocation: string;
  quantity: number;
  batchNumber: string;
  price: number;
  expiry: string;
  lat: number;
  lng: number;
  category: string;
};

const GOOGLE_MAPS_PATTERNS = [
  /^https:\/\/goo\.gl\/maps\//,
  /^https:\/\/maps\.google\.com\//,
  /^https:\/\/maps\.app\.goo\.gl\//,
];

export default function AddMachine({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
}) {
  const cancelButtonRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Inputs>();

  const machineCode = watch("machine_code") ?? "";
  const isButterfly = machineCode.startsWith("3");

  const onSubmit = async (data: Inputs) => {
    setLoading(true);
    try {
      await postRequest(`/ops/addNewMachine`, {
        machineCode: data.machine_code,
        name: data.machine_name,
        image: data.image,
        price: data.price,
        locationName: data.machine_location,
        machine_city:data.machine_city,
        mapLocation: data.mapLocation,
        machineType: data.machine_type,
        variantType: data.variant_type,
        quantity: data.quantity,
        batchNumber: data.batchNumber,
        expiryDate: data.expiry,
        is_active: enabled ? 1 : 0,
        lat: data.lat,
        lng: data.lng,
        category: data.category,
      });
      
      alert("Machine added successfully!");
      reset();
      setEnabled(false);
      setOpen(false);
    } catch (error: unknown) {
      console.error("API Error:", error);
      const message =
        error instanceof Error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? error.message
          : "An unexpected error occurred.";
      alert(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6";

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={setOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 mt-20 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all dark:bg-gray-900 sm:my-8 sm:w-full sm:max-w-lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 p-4">
                  {/* Machine Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Machine Code
                    </label>
                    <input
                      type="number"
                      {...register("machine_code", {
                        required: "Machine Code is required.",
                        validate: (v) =>
                          /^\d/.test(v) || "Machine code must start with a digit.",
                      })}
                      className={inputClass}
                      placeholder="Enter Machine Code"
                    />
                    {errors.machine_code && (
                      <span className="text-sm text-red-500">{errors.machine_code.message}</span>
                    )}
                  </div>

                  {/* Product Name — hidden for Butterfly (code starts with 3) */}
                  {!isButterfly && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Product Name
                      </label>
                      <input
                        type="text"
                        {...register("machine_name", {
                          required: "Product Name is required.",
                        })}
                        className={inputClass}
                        placeholder="Enter Product Name"
                      />
                      {errors.machine_name && (
                        <span className="text-sm text-red-500">{errors.machine_name.message}</span>
                      )}
                    </div>
                  )}

                  {/* Image URL — hidden for Butterfly */}
                  {!isButterfly && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Product Image URL
                      </label>
                      <input
                        type="url"
                        {...register("image", {
                          required: "Product Image URL is required.",
                          validate: (v) =>
                            /^https?:\/\/.+/.test(v) || "Must be a valid URL starting with http(s)://",
                        })}
                        className={inputClass}
                        placeholder="https://example.com/image.png"
                      />
                      {errors.image && (
                        <span className="text-sm text-red-500">{errors.image.message}</span>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Product Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("price", {
                        required: "Price is required.",
                        min: { value: 0, message: "Price must be positive." },
                        validate: (v) => !isNaN(Number(v)) || "Price must be a number.",
                      })}
                      className={inputClass}
                      placeholder="Enter Product Price"
                    />
                    {errors.price && (
                      <span className="text-sm text-red-500">{errors.price.message}</span>
                    )}
                  </div>

                  {/* Location Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Location Name
                    </label>
                    <input
                      type="text"
                      {...register("machine_location", {
                        required: "Location Name is required.",
                      })}
                      className={inputClass}
                      placeholder="Enter Location Name"
                    />
                    {errors.machine_location && (
                      <span className="text-sm text-red-500">{errors.machine_location.message}</span>
                    )}
                  </div>

                  {/* Location Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Location City
                    </label>
                    <select 
                      {...register("machine_city", {
                        required: "Location City is required.",
                      })}
                      className={inputClass}>
                      <option value="" disabled >Select City</option>
                      <option value="karachi">Karachi</option>
                      <option value="lahore">Lahore</option>
                      <option value="islamabad">Islamabad</option>
                      <option value="multan">Multan</option>
                    </select>
                    {errors.machine_city && (
                      <span className="text-sm text-red-500">{errors.machine_city.message}</span>
                    )}
                  </div>

                  {/* Map Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Map Location (Google Maps URL)
                    </label>
                    <input
                      type="text"
                      {...register("mapLocation", {
                        required: "Map Location is required.",
                        validate: (v) =>
                          GOOGLE_MAPS_PATTERNS.some((p) => p.test(v)) ||
                          "Must be a valid Google Maps URL.",
                      })}
                      className={inputClass}
                      placeholder="https://maps.app.goo.gl/..."
                    />
                    {errors.mapLocation && (
                      <span className="text-sm text-red-500">{errors.mapLocation.message}</span>
                    )}
                  </div>

                  {/* Quantity & Batch Number */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        {...register("quantity", {
                          required: "Quantity is required.",
                          min: { value: 1, message: "Quantity must be at least 1." },
                          validate: (v) => !isNaN(Number(v)) || "Must be a number.",
                        })}
                        className={inputClass}
                        placeholder="Litres / Units"
                      />
                      {errors.quantity && (
                        <span className="text-sm text-red-500">{errors.quantity.message}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        {...register("batchNumber", {
                          required: "Batch Number is required.",
                        })}
                        className={inputClass}
                        placeholder="Enter Batch Number"
                      />
                      {errors.batchNumber && (
                        <span className="text-sm text-red-500">{errors.batchNumber.message}</span>
                      )}
                    </div>
                  </div>

                  {/* Machine Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Machine Type
                    </label>
                    <select
                      {...register("machine_type", { required: "Machine Type is required." })}
                      className={inputClass}
                      defaultValue=""
                    >
                      <option value="" disabled>Select Machine Type</option>
                      <option value="product">Sanitary</option>
                      <option value="liquid">Dispensing</option>
                    </select>
                    {errors.machine_type && (
                      <span className="text-sm text-red-500">{errors.machine_type.message}</span>
                    )}
                  </div>

                  {/* Variant Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Variant Type
                    </label>
                    <select
                      {...register("variant_type", { required: "Variant Type is required." })}
                      className={inputClass}
                      defaultValue=""
                    >
                      <option value="" disabled>Select Variant Type</option>
                      <option value="besties">Besties</option>
                      <option value="breathable">Breathable</option>
                      <option value="corporate">Corporate</option>
                      <option value="value">Value</option>
                    </select>
                    {errors.variant_type && (
                      <span className="text-sm text-red-500">{errors.variant_type.message}</span>
                    )}
                  </div>

                  {/* Machine Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Machine Category
                    </label>
                    <select
                      {...register("category", { required: "Category is required." })}
                      className={inputClass}
                      defaultValue=""
                    >
                      <option value="" disabled>Select Category</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                    {errors.category && (
                      <span className="text-sm text-red-500">{errors.category.message}</span>
                    )}
                  </div>

                  {/* Expiry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expiry of Product
                    </label>
                    <input
                      type="date"
                      {...register("expiry", {
                        required: "Expiry date is required.",
                        validate: (v) =>
                          new Date(v) > new Date() || "Expiry date must be in the future.",
                      })}
                      className={inputClass}
                    />
                    {errors.expiry && (
                      <span className="text-sm text-red-500">{errors.expiry.message}</span>
                    )}
                  </div>

                  {/* Lat / Lng / Active */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        {...register("lat", {
                          required: "Latitude is required.",
                          min: { value: -90, message: "Min -90" },
                          max: { value: 90, message: "Max 90" },
                          validate: (v) => {
                            const dec = v?.toString().split(".")[1];
                            return (!dec || dec.length >= 4) || "At least 4 decimal places required.";
                          },
                        })}
                        className={inputClass}
                        placeholder="e.g. 25.4435"
                      />
                      {errors.lat && (
                        <span className="text-sm text-red-500">{errors.lat.message}</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        {...register("lng", {
                          required: "Longitude is required.",
                          min: { value: -180, message: "Min -180" },
                          max: { value: 180, message: "Max 180" },
                          validate: (v) => {
                            const dec = v?.toString().split(".")[1];
                            return (!dec || dec.length >= 4) || "At least 4 decimal places required.";
                          },
                        })}
                        className={inputClass}
                        placeholder="e.g. 55.3762"
                      />
                      {errors.lng && (
                        <span className="text-sm text-red-500">{errors.lng.message}</span>
                      )}
                    </div>

                    <div className="flex flex-col justify-end pb-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Active
                      </label>
                      <Switch
                        checked={enabled}
                        onChange={setEnabled}
                        className={`${
                          enabled ? "bg-teal-600" : "bg-gray-200"
                        } relative inline-flex h-5 w-10 cursor-pointer rounded-full transition-colors duration-200 ease-in-out`}
                      >
                        <span className="sr-only">Enable setting</span>
                        <span
                          className={`${
                            enabled ? "translate-x-5" : "translate-x-0"
                          } inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out`}
                        />
                      </Switch>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-1">
                    <button
                      type="button"
                      disabled={loading}
                      className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                      onClick={() => setOpen(false)}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
                    >
                      {loading ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
