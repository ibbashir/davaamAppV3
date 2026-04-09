import { Fragment, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { deleteRequest } from "@/Apis/Api";
import type { ApiMachine } from "../Types";

export default function DeleteMachine({
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
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!machine) return;
    setLoading(true);
    try {
      await deleteRequest(`/ops/deleteMachine/${machine.machine_code}`);
      alert("Machine deleted successfully!");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error?.response?.data?.message || "Failed to delete machine.");
    } finally {
      setLoading(false);
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

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all dark:bg-gray-900 sm:my-8 sm:w-full sm:max-w-md">
                <div className="p-6 space-y-4">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Machine
                  </Dialog.Title>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Are you sure you want to delete machine{" "}
                    <span className="font-semibold text-red-600">
                      {machine?.machine_code}
                    </span>{" "}
                    ({machine?.machine_name})?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This will permanently remove the machine, all its brands,
                    fillings, and associated cash card. This action cannot be
                    undone.
                  </p>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      ref={cancelButtonRef}
                      disabled={loading}
                      className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                      onClick={handleDelete}
                    >
                      {loading ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
