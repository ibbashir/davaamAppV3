import { Fragment, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { Switch } from "@headlessui/react";
import { postRequest } from "@/Apis/Api";

type Inputs = {
  machine_code: string;
  machine_name: number;
  machine_location: number;
  machine_type: string;
  variant_type:string;
  mapLocation: string;
  quantity: number;
  batchNumber: number;
  price: number;
  expiry: Date;
  lat: number;
  lng: number;
};

export default function AddMachine({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: any;
}) {
  const cancelButtonRef = useRef(null);

  const [enabled, setEnabled] = useState(false);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Inputs>();

  const onSubmit = async (data: any) => {
    const bodyData = {
      machineCode: data.machine_code,
      name: data.machine_name,
      price: data.price,
      locationName: data.machine_location,
      mapLocation: data.mapLocation,
      machineType: data.machine_type,
      variantType:data.variant_type,
      quantity: data.quantity,
      batchNumber: data.batchNumber,
      expiryDate: data.expiry,
      created_at: Date.now(),
      is_active: enabled ? 1 : 0,
      lat: data.lat,
      lng: data.lng,
    };
    console.log(bodyData);
    try {
      const response = await postRequest(`/ops/addNewMachine`,bodyData)
      console.log(response)
      if (response.status===200) {
        alert("Machine added successfully!");
        reset();
        setOpen(false);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("API Error:", error);
      alert("Failed to insert machine.");
    }
  };

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
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-2 p-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Machine Code
                    </label>
                    <input
                      type="text"
                      {...register("machine_code", {
                        required: "Machine Code is required.",
                      })}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                      placeholder="Enter Machine Code"
                    />
                    {errors.machine_code && (
                      <span className="text-sm text-red-500">
                        {errors.machine_code.message}
                      </span>
                    )}
                  </div>

                  {/* Conditionally Show Product Name */}
                  {watch("machine_code") &&
                    !watch("machine_code").startsWith("3") && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Product Name
                        </label>
                        <input
                          type="text"
                          {...register("machine_name", {
                            required: "Machine Name is required.",
                          })}
                          className="block w-full rounded-md bg-white px-3 py-1 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                          placeholder="Enter Machine Name"
                        />
                        {errors.machine_name && (
                          <span className="text-sm text-red-500">
                            {errors.machine_name.message}
                          </span>
                        )}
                      </div>
                    )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Product Price
                    </label>
                    <input
                      type="text"
                      {...register("price", {
                        required: "Price is required.",
                      })}
                      className="block w-full rounded-md bg-white px-3 py-1 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                      placeholder="Enter Product Price"
                    />
                    {errors.price && (
                      <span className="text-sm text-red-500">
                        {errors.price.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Location Name
                    </label>
                    <input
                      type="text"
                      {...register("machine_location", {
                        required: "Machine Location is required.",
                      })}
                      className="block w-full rounded-md bg-white px-3 py-1 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                      placeholder="Enter Location Name"
                    />
                    {errors.machine_location && (
                      <span className="text-sm text-red-500">
                        {errors.machine_location.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Map Location
                    </label>
                    <input
                      type="text"
                       {...register("mapLocation", {
                            required: "Location is required.",
                            validate: {
                                validGoogleMaps: (value) => {
                                const googleMapsPatterns = [
                                    /^https:\/\/goo\.gl\/maps\//,
                                    /^https:\/\/maps\.google\.com\//,
                                    /^https:\/\/maps\.app\.goo\.gl\//
                                ];
                                
                                const isValid = googleMapsPatterns.some(pattern => pattern.test(value));
                                return isValid || "Please enter a valid Google Maps URL";
                                }
                            }
                        })}
                      className="block w-full rounded-md bg-white px-3 py-1 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                      placeholder="Enter Location"
                    />
                    {errors.mapLocation && (
                      <span className="text-sm text-red-500">
                        {errors.mapLocation.message}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quantity
                      </label>
                      <input
                        type="text"
                        {...register("quantity", {
                          required: "quantity is required.",
                        })}
                        className="block w-full rounded-md bg-white px-3 py-1 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                        placeholder="Enter Quantity (Note: Liquid must be in Litres)"
                      />
                      {errors.quantity && (
                        <span className="text-sm text-red-500">
                          {errors.quantity.message}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        {...register("batchNumber", {
                          required: "BatchNumber is required.",
                        })}
                        className="block w-full rounded-md bg-white px-3 py-1 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                        placeholder="Enter Batch Number"
                      />
                      {errors.batchNumber && (
                        <span className="text-sm text-red-500">
                          {errors.batchNumber.message}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Machine Type
                    </label>
                    <select
                      {...register("machine_type", {
                        required: "Machine Type is required.",
                      })}
                      className="block w-full rounded-md bg-white px-3 py-1 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select Machine Type
                      </option>
                      <option value="product">Sanitary</option>
                      <option value="liquid">Dispening</option>
                    </select>
                    {errors.machine_type && (
                      <span className="text-sm text-red-500">
                        {errors.machine_type.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Variant Type
                    </label>
                    <select
                      {...register("variant_type", {
                        required: "Variant Type is required.",
                      })}
                      className="block w-full rounded-md bg-white px-3 py-1 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select Variant Type
                      </option>
                      <option value="besties">Besties</option>
                      <option value="breathable">Breathable</option>
                      <option value="corporate">Corporate</option>
                      <option value="value">Value</option>
                    </select>
                    {errors.variant_type && (
                      <span className="text-sm text-red-500">
                        {errors.variant_type.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expiry of Product
                    </label>
                    <input
                      type="date"
                      {...register("expiry", {
                        required: "Date is required.",
                      })}
                      className="block w-full rounded-md bg-white px-3 py-1 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                    />
                    {errors.expiry && (
                      <span className="text-sm text-red-500">
                        {errors.expiry.message}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Latitude
                        </label>
                        <input
                            type="number"
                            step="0.0001"
                            {...register("lat", {
                            required: "Latitude is required.",
                            min: { value: -90, message: "Latitude cannot be less than -90" },
                            max: { value: 90, message: "Latitude cannot be greater than 90" },
                            validate: {
                                precision: (value) => {
                                if (!value) return true;
                                const decimalPart = value.toString().split('.')[1];
                                return (!decimalPart || decimalPart.length >= 4) || 
                                    "Must have at least 4 decimal places (e.g., 25.4435)";
                                }
                            }
                            })}
                            className="block w-full rounded-md bg-white px-3 py-1 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                            placeholder="Enter Latitude (e.g., 25.443526)"
                        />
                        {errors.lat && (
                            <span className="text-sm text-red-500">
                            {errors.lat.message}
                            </span>
                        )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...register("lng", {
                          required: "Longitude is required.",
                          min: { value: -90, message: "Longitude cannot be less than -90" },
                          max: { value: 90, message: "Longitude cannot be greater than 90" },
                          validate: {
                                precision: (value) => {
                                if (!value) return true;
                                const decimalPart = value.toString().split('.')[1];
                                return (!decimalPart || decimalPart.length >= 4) || 
                                    "Must have at least 4 decimal places (e.g., 25.4435)";
                                }
                            }
                        })}
                        className="block w-full rounded-md bg-white px-3 py-1 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                        placeholder="Enter Longitude"
                      />
                      {errors.lng && (
                        <span className="text-sm text-red-500">
                          {errors.lng.message}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                      onClick={() => setOpen(false)}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
                    >
                      Submit
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
