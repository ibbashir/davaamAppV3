import { Fragment, useRef, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { Switch } from "@headlessui/react";
import { putRequest } from "@/Apis/Api";
import type { ApiMachine } from "../Types";

type UpdateInputs = {
  locationName: string;
  mapLocation: string;
  machineType: string;
  lat: number;
  lng: number;
  price: number;
};

export default function UpdateMachine({
  open,
  setOpen,
  machine,
  onSuccess,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  machine: ApiMachine | null;
  onSuccess: () => void;
}) {
  const cancelButtonRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateInputs>();

  useEffect(() => {
    if (machine && open) {
      reset({
        locationName: machine.machine_name,
        mapLocation: machine.machine_location ?? "",
        machineType: machine.machine_type,
        lat: machine.lat ?? undefined,
        lng: machine.lng ?? undefined,
      });
      setIsActive(machine.is_active === "1" || machine.is_active === "true");
    }
  }, [machine, open, reset]);

  const onSubmit = async (data: UpdateInputs) => {
    if (!machine) return;
    try {
      await putRequest(`/ops/updateMachine/${machine.machine_code}`, {
        locationName: data.locationName,
        mapLocation: data.mapLocation,
        machineType: data.machineType,
        lat: data.lat,
        lng: data.lng,
        price: data.price,
        isActive: isActive ? 1 : 0,
      });
      alert("Machine updated successfully!");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error("Update error:", error);
      alert(error?.response?.data?.message || "Failed to update machine.");
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
                  className="space-y-3 p-5"
                >
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    Update Machine —{" "}
                    <span className="text-teal-600">{machine?.machine_code}</span>
                  </Dialog.Title>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Location Name
                    </label>
                    <input
                      type="text"
                      {...register("locationName", {
                        required: "Location name is required.",
                      })}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                      placeholder="Enter Location Name"
                    />
                    {errors.locationName && (
                      <span className="text-sm text-red-500">
                        {errors.locationName.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Map Location (Google Maps URL)
                    </label>
                    <input
                      type="text"
                      {...register("mapLocation", {
                        validate: {
                          validGoogleMaps: (value) => {
                            if (!value) return true;
                            const patterns = [
                              /^https:\/\/goo\.gl\/maps\//,
                              /^https:\/\/maps\.google\.com\//,
                              /^https:\/\/maps\.app\.goo\.gl\//,
                            ];
                            return (
                              patterns.some((p) => p.test(value)) ||
                              "Please enter a valid Google Maps URL"
                            );
                          },
                        },
                      })}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                      placeholder="https://maps.app.goo.gl/..."
                    />
                    {errors.mapLocation && (
                      <span className="text-sm text-red-500">
                        {errors.mapLocation.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Machine Type
                    </label>
                    <select
                      {...register("machineType", {
                        required: "Machine Type is required.",
                      })}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm"
                    >
                      <option value="" disabled>
                        Select Machine Type
                      </option>
                      <option value="product">Sanitary</option>
                      <option value="liquid">Dispensing</option>
                    </select>
                    {errors.machineType && (
                      <span className="text-sm text-red-500">
                        {errors.machineType.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("price")}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                      placeholder="Enter Price"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        {...register("lat", {
                          min: { value: -90, message: "Min -90" },
                          max: { value: 90, message: "Max 90" },
                        })}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                        placeholder="e.g. 25.4435"
                      />
                      {errors.lat && (
                        <span className="text-sm text-red-500">
                          {errors.lat.message}
                        </span>
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
                          min: { value: -180, message: "Min -180" },
                          max: { value: 180, message: "Max 180" },
                        })}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
                        placeholder="e.g. 55.3762"
                      />
                      {errors.lng && (
                        <span className="text-sm text-red-500">
                          {errors.lng.message}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col justify-end pb-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Active
                      </label>
                      <Switch
                        checked={isActive}
                        onChange={setIsActive}
                        className={`${
                          isActive ? "bg-teal-600" : "bg-gray-200"
                        } relative inline-flex h-5 w-10 cursor-pointer rounded-full transition-colors duration-200 ease-in-out`}
                      >
                        <span className="sr-only">Active</span>
                        <span
                          className={`${
                            isActive ? "translate-x-5" : "translate-x-0"
                          } inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out`}
                        />
                      </Switch>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      ref={cancelButtonRef}
                      className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
                    >
                      Update
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
