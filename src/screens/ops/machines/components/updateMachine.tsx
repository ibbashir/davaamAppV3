import { Fragment, forwardRef, useRef, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm, useWatch } from "react-hook-form";
import { Switch } from "@headlessui/react";
import { putRequest, getRequest } from "@/Apis/Api";
import { X, Cpu, ChevronDown } from "lucide-react";
import type { ApiMachine } from "../Types";

type UpdateInputs = {
  locationName: string;
  machine_city: string;
  mapLocation: string;
  machineType: string;
  variantType: string;
  category: string;
  lat: number;
  lng: number;
  price: number;
};

const GOOGLE_MAPS_PATTERNS = [
  /^https:\/\/goo\.gl\/maps\//,
  /^https:\/\/maps\.google\.com\//,
  /^https:\/\/maps\.app\.goo\.gl\//,
];

const inputClass =
  "block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-teal-500 dark:focus:bg-gray-800";

const selectClass =
  "block w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-9 text-sm text-gray-900 transition-colors cursor-pointer hover:border-gray-300 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:hover:border-gray-600 dark:focus:border-teal-500 dark:focus:bg-gray-800";

// Controlled select — accepts value + onChange so RHF can drive it directly
const SelectField = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function SelectField({ children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} {...props} className={selectClass}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
    </div>
  );
});

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
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [paymentMethodError, setPaymentMethodError] = useState("");
  const [butterflyProducts, setButterflyProducts] = useState<ButterflyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const isButterfly = machine?.machine_code?.startsWith("3") ?? false;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm<UpdateInputs>();

  // Watch the three selects that need controlled behavior
  const watchedMachineType = useWatch({ control, name: "machineType", defaultValue: "" });
  const watchedVariantType = useWatch({ control, name: "variantType", defaultValue: "" });
  const watchedCategory    = useWatch({ control, name: "category",    defaultValue: "" });
  const watchedCity        = useWatch({ control, name: "machine_city", defaultValue: "" });

  // Fetch butterfly products when modal opens
  useEffect(() => {
    if (!open) return;
    setProductsLoading(true);
    getRequest<{ success?: boolean; data?: unknown }>("/ops/getButterflyProducts")
      .then((result) => {
        const data = result?.data ?? result;
        const list = Array.isArray(data) ? data : data ? [data] : [];
        setButterflyProducts(list as ButterflyProduct[]);
      })
      .catch(() => setButterflyProducts([]))
      .finally(() => setProductsLoading(false));
  }, [open]);

  // Single effect: populate form only after BOTH machine and products are ready
  useEffect(() => {
    if (!machine || !open || productsLoading) return;
    // If this is a butterfly machine, wait for products to be loaded
    if (isButterfly && butterflyProducts.length === 0) return;

    console.log(machine)
    reset({
      locationName: machine.machine_name ?? "",
      machine_city: machine.city?.toLowerCase() ?? "",
      mapLocation:  machine.machine_location ?? "",
      machineType:  machine.machine_code?.startsWith("3") ? "sanitary" : "dispensing",
      variantType:  machine.variant?.toLowerCase() ?? "",
      category:     machine.category?.toLowerCase() ?? "",
      lat:          machine.lat ?? undefined,
      lng:          machine.lng ?? undefined,
      price:        machine.price ? Number(machine.price) : undefined,
    });

    setIsActive(machine.is_active === "1" || machine.is_active === "true");
    const methods = machine.payment_methods ?? machine.payment_method ?? [];
    setPaymentMethods(Array.isArray(methods) ? methods : []);
    setPaymentMethodError("");
  }, [machine, open, reset, butterflyProducts, productsLoading, isButterfly]);

  const togglePaymentMethod = (method: string) => {
    setPaymentMethodError("");
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  };

  const onSubmit = async (data: UpdateInputs) => {
    if (!machine) return;
    if (paymentMethods.length === 0) {
      setPaymentMethodError("Select at least one payment method.");
      return;
    }
    setLoading(true);
    try {
      await putRequest(`/ops/updateMachine/${machine.machine_code}`, {
        locationName:   data.locationName,
        machine_city:   data.machine_city,
        mapLocation:    data.mapLocation,
        machineType:    data.machineType,
        variantType:    data.variantType,
        category:       data.category,
        lat:            data.lat,
        lng:            data.lng,
        price:          data.price,
        payment_method: paymentMethods,
        isActive:       isActive ? 1 : 0,
      });
      alert("Machine updated successfully!");
      setOpen(false);
      onSuccess();
    } catch (error: unknown) {
      console.error("Update error:", error);
      const message =
        error instanceof Error
          ? ((error as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? error.message)
          : "Failed to update machine.";
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
                      Update Machine{" "}
                      <span className="text-teal-600 dark:text-teal-400">
                        #{machine?.machine_code}
                      </span>
                    </Dialog.Title>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Edit the details for this machine
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
                      <FieldLabel>Machine Type</FieldLabel>
                      {/* KEY FIX: pass value= explicitly so the select reflects RHF state */}
                      <SelectField
                        {...register("machineType", { required: "Required." })}
                        value={watchedMachineType}
                        onChange={(e) => setValue("machineType", e.target.value, { shouldValidate: true })}
                      >
                        <option value="" disabled>Select type</option>
                        <option value="sanitary">Sanitary</option>
                        <option value="dispensing">Dispensing</option>
                      </SelectField>
                      <FieldError message={errors.machineType?.message} />
                    </div>

                    <div>
                      <FieldLabel>Variant Type</FieldLabel>
                      {productsLoading ? (
                        <div className={`${inputClass} text-gray-400 dark:text-gray-500`}>
                          Loading variants…
                        </div>
                      ) : (
                        <SelectField
                          {...register("variantType", { required: "Required." })}
                          value={watchedVariantType}
                          onChange={(e) => setValue("variantType", e.target.value, { shouldValidate: true })}
                        >
                          <option value="" disabled>Select variant</option>
                          {butterflyProducts.map((p) => (
                            <option key={p.id} value={p.skin.toLowerCase()}>
                              {p.skin}
                            </option>
                          ))}
                        </SelectField>
                      )}
                      <FieldError message={errors.variantType?.message} />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Category</FieldLabel>
                    <SelectField
                      {...register("category", { required: "Required." })}
                      value={watchedCategory}
                      onChange={(e) => setValue("category", e.target.value, { shouldValidate: true })}
                    >
                      <option value="" disabled>Select category</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </SelectField>
                    <FieldError message={errors.category?.message} />
                  </div>

                  <div>
                    <FieldLabel>Payment Method</FieldLabel>
                    <div className="flex gap-2">
                      {["Cash", "App", "Employee ID"].map((method) => {
                        const selected = paymentMethods.includes(method);
                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() => togglePaymentMethod(method)}
                            className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${
                              selected
                                ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-500 dark:bg-teal-900/30 dark:text-teal-300"
                                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-gray-600"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${selected ? "bg-teal-500" : "bg-gray-300 dark:bg-gray-600"}`}
                            />
                            {method}
                          </button>
                        );
                      })}
                    </div>
                    {paymentMethodError && (
                      <p className="mt-1 text-xs text-red-500">{paymentMethodError}</p>
                    )}
                  </div>

                  {!isButterfly && (
                    <>
                      <SectionHeading>Product Details</SectionHeading>
                      <div>
                        <FieldLabel>Product Price</FieldLabel>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register("price", {
                            min: { value: 0, message: "Must be positive." },
                            validate: (v) =>
                              v === undefined || !isNaN(Number(v)) || "Must be a number.",
                          })}
                          className={inputClass}
                          placeholder="0.00"
                        />
                        <FieldError message={errors.price?.message} />
                      </div>
                    </>
                  )}

                  <SectionHeading>Location</SectionHeading>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Location Name</FieldLabel>
                      <input
                        type="text"
                        {...register("locationName", { required: "Required." })}
                        className={inputClass}
                        placeholder="e.g. DHA Phase 5"
                      />
                      <FieldError message={errors.locationName?.message} />
                    </div>

                    <div>
                      <FieldLabel>City</FieldLabel>
                      <SelectField
                        {...register("machine_city", { required: "Required." })}
                        value={watchedCity}
                        onChange={(e) => setValue("machine_city", e.target.value, { shouldValidate: true })}
                      >
                        <option value="" disabled>Select city</option>
                        <option value="karachi">Karachi</option>
                        <option value="lahore">Lahore</option>
                        <option value="islamabad">Islamabad</option>
                        <option value="multan">Multan</option>
                      </SelectField>
                      <FieldError message={errors.machine_city?.message} />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Google Maps URL</FieldLabel>
                    <input
                      type="text"
                      {...register("mapLocation", {
                        validate: (v) =>
                          !v ||
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
                          min: { value: -90, message: "Min -90" },
                          max: { value: 90, message: "Max 90" },
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
                          min: { value: -180, message: "Min -180" },
                          max: { value: 180, message: "Max 180" },
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
                      checked={isActive}
                      onChange={setIsActive}
                      className={`${
                        isActive ? "bg-teal-600" : "bg-gray-200 dark:bg-gray-600"
                      } relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2`}
                    >
                      <span className="sr-only">Enable machine</span>
                      <span
                        className={`${
                          isActive ? "translate-x-6" : "translate-x-1"
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
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
                      {loading ? "Updating..." : "Update Machine"}
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