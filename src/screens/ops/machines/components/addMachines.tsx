import { Fragment, useRef, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { Switch } from "@headlessui/react";
import { postRequest, getRequest } from "@/Apis/Api";
import { X, Cpu } from "lucide-react";

type Inputs = {
  machine_code: string;
  machine_name: string;
  image: string;
  machine_location: string;
  machine_city: string;
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

const inputClass =
  "block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-teal-500 dark:focus:bg-gray-800";

const selectClass =
  "block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:focus:border-teal-500 dark:focus:bg-gray-800";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-xs font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
        {children}
      </span>
      <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700" />
    </div>
  );
}

interface ButterflyProduct {
  id: number;
  skin: string;
}

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
  const [butterflyProducts, setButterflyProducts] = useState<
    ButterflyProduct[]
  >([]);

  useEffect(() => {
    if (!open) return;
    getRequest<{ success?: boolean; data?: unknown }>(
      "/ops/getButterflyProducts",
    )
      .then((result) => {
        const data = result?.data ?? result;
        const list = Array.isArray(data) ? data : data ? [data] : [];
        setButterflyProducts(list as ButterflyProduct[]);
      })
      .catch(() => setButterflyProducts([]));
  }, [open]);

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
        machine_city: data.machine_city,
        mapLocation: data.mapLocation,
        machineType: data.machine_type,
        variantType: data.variant_type,
        quantity: data.quantity,
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
          ? ((error as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? error.message)
          : "An unexpected error occurred.";
      alert(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        initialFocus={cancelButtonRef}
        onClose={setOpen}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-2"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-2"
            >
              <Dialog.Panel className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-700/60">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30">
                    <Cpu className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Add New Machine
                    </Dialog.Title>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Fill in the details to register a machine
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Body */}
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4 px-6 py-5"
                >
                  <SectionHeading>Machine Info</SectionHeading>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Machine Code</FieldLabel>
                      <input
                        type="number"
                        {...register("machine_code", {
                          required: "Required.",
                          validate: (v) =>
                            /^\d/.test(v) || "Must start with a digit.",
                        })}
                        className={inputClass}
                        placeholder="e.g. 10023"
                      />
                      <FieldError message={errors.machine_code?.message} />
                    </div>

                    <div>
                      <FieldLabel>Machine Type</FieldLabel>
                      <select
                        {...register("machine_type", { required: "Required." })}
                        className={selectClass}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select type
                        </option>
                        <option value="sanitary">Sanitary</option>
                        <option value="dispensing">Dispensing</option>
                      </select>
                      <FieldError message={errors.machine_type?.message} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Variant Type</FieldLabel>
                      <select
                        {...register("variant_type", { required: "Required." })}
                        className={selectClass}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select variant
                        </option>
                        {butterflyProducts.map((p) => (
                          <option key={p.id} value={p.skin}>
                            {p.skin}
                          </option>
                        ))}
                      </select>
                      <FieldError message={errors.variant_type?.message} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>Quantity</FieldLabel>
                        <input
                          type="number"
                          min="1"
                          {...register("quantity", {
                            required: "Required.",
                            min: { value: 1, message: "At least 1." },
                            validate: (v) =>
                              !isNaN(Number(v)) || "Must be a number.",
                          })}
                          className={inputClass}
                          placeholder="Units Per Row"
                        />
                        <FieldError message={errors.quantity?.message} />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Category</FieldLabel>
                      <select
                        {...register("category", { required: "Required." })}
                        className={selectClass}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select category
                        </option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                      </select>
                      <FieldError message={errors.category?.message} />
                    </div>
                  </div>

                  {!isButterfly && (
                    <>
                      <SectionHeading>Product Details</SectionHeading>

                      <div>
                        <FieldLabel>Product Name</FieldLabel>
                        <input
                          type="text"
                          {...register("machine_name", {
                            required: "Required.",
                          })}
                          className={inputClass}
                          placeholder="Enter product name"
                        />
                        <FieldError message={errors.machine_name?.message} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Product Image URL</FieldLabel>
                          <input
                            type="url"
                            {...register("image", {
                              required: "Required.",
                              validate: (v) =>
                                /^https?:\/\/.+/.test(v) ||
                                "Must be a valid URL.",
                            })}
                            className={inputClass}
                            placeholder="https://..."
                          />
                          <FieldError message={errors.image?.message} />
                        </div>

                        <div>
                          <FieldLabel>Product Price</FieldLabel>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register("price", {
                              required: "Required.",
                              min: { value: 0, message: "Must be positive." },
                              validate: (v) =>
                                !isNaN(Number(v)) || "Must be a number.",
                            })}
                            className={inputClass}
                            placeholder="0.00"
                          />
                          <FieldError message={errors.price?.message} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Quantity</FieldLabel>
                          <input
                            type="number"
                            min="1"
                            {...register("quantity", {
                              required: "Required.",
                              min: { value: 1, message: "At least 1." },
                              validate: (v) =>
                                !isNaN(Number(v)) || "Must be a number.",
                            })}
                            className={inputClass}
                            placeholder="Litres / Units"
                          />
                          <FieldError message={errors.quantity?.message} />
                        </div>
                      </div>
                    </>
                  )}

                  <SectionHeading>Location</SectionHeading>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Location Name</FieldLabel>
                      <input
                        type="text"
                        {...register("machine_location", {
                          required: "Required.",
                        })}
                        className={inputClass}
                        placeholder="e.g. DHA Phase 5"
                      />
                      <FieldError message={errors.machine_location?.message} />
                    </div>

                    <div>
                      <FieldLabel>City</FieldLabel>
                      <select
                        {...register("machine_city", { required: "Required." })}
                        className={selectClass}
                      >
                        <option value="" disabled>
                          Select city
                        </option>
                        <option value="karachi">Karachi</option>
                        <option value="lahore">Lahore</option>
                        <option value="islamabad">Islamabad</option>
                        <option value="multan">Multan</option>
                      </select>
                      <FieldError message={errors.machine_city?.message} />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Google Maps URL</FieldLabel>
                    <input
                      type="text"
                      {...register("mapLocation", {
                        required: "Required.",
                        validate: (v) =>
                          GOOGLE_MAPS_PATTERNS.some((p) => p.test(v)) ||
                          "Must be a valid Google Maps URL.",
                      })}
                      className={inputClass}
                      placeholder="https://maps.app.goo.gl/..."
                    />
                    <FieldError message={errors.mapLocation?.message} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Latitude</FieldLabel>
                      <input
                        type="number"
                        step="0.0001"
                        {...register("lat", {
                          required: "Required.",
                          min: { value: -90, message: "Min -90" },
                          max: { value: 90, message: "Max 90" },
                          validate: (v) => {
                            const dec = v?.toString().split(".")[1];
                            return (
                              !dec ||
                              dec.length >= 4 ||
                              "4 decimal places required."
                            );
                          },
                        })}
                        className={inputClass}
                        placeholder="e.g. 25.4435"
                      />
                      <FieldError message={errors.lat?.message} />
                    </div>

                    <div>
                      <FieldLabel>Longitude</FieldLabel>
                      <input
                        type="number"
                        step="0.0001"
                        {...register("lng", {
                          required: "Required.",
                          min: { value: -180, message: "Min -180" },
                          max: { value: 180, message: "Max 180" },
                          validate: (v) => {
                            const dec = v?.toString().split(".")[1];
                            return (
                              !dec ||
                              dec.length >= 4 ||
                              "4 decimal places required."
                            );
                          },
                        })}
                        className={inputClass}
                        placeholder="e.g. 67.0697"
                      />
                      <FieldError message={errors.lng?.message} />
                    </div>
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/40">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Active
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Machine is live and accepting transactions
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onChange={setEnabled}
                      className={`${
                        enabled ? "bg-teal-600" : "bg-gray-200 dark:bg-gray-600"
                      } relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2`}
                    >
                      <span className="sr-only">Enable machine</span>
                      <span
                        className={`${
                          enabled ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out`}
                      />
                    </Switch>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-700/60">
                    <button
                      type="button"
                      ref={cancelButtonRef}
                      disabled={loading}
                      onClick={() => setOpen(false)}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
                    >
                      {loading && (
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                      )}
                      {loading ? "Submitting..." : "Add Machine"}
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
