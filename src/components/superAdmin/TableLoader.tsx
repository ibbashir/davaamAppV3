import { Card } from "./ui/card";

const TableLoader = (props: { tableLoaderData: { name: string }[] }) => {

    const { tableLoaderData } = props

    return (
        <Card className="w-full h-full sm:overflow-auto px-6 mt-5">
            <div className="mt-8 overflow-x-scroll xl:overflow-x-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="!border-px !border-gray-400">
                            {
                                tableLoaderData.map((heading: { name: string }, i: number) => (
                                    <th key={heading.name || i} className="cursor-pointer border-b-[1px] border-gray-200 pb-2 pr-4 pt-4 text-start">
                                        <div className="items-center justify-between text-xs text-gray-200">
                                            <p className="text-sm font-bold text-gray-600 dark:text-white">
                                                {heading.name}
                                            </p>
                                        </div>
                                    </th>
                                ))
                            }
                        </tr>
                    </thead>
                    <tbody>
                        {
                            tableLoaderData.map((_heading: { name: string }, rowIndex: number) => {
                                return (
                                    <tr key={rowIndex} className="animate-pulse">
                                        {
                                            tableLoaderData.map((_col: { name: string }, i: number) => (
                                                <td key={i} className="min-w-[150px] border-white/0 py-3  pr-4">
                                                    <div className="h-4 w-32 rounded bg-gray-400"></div>
                                                </td>
                                            ))
                                        }
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </div>
        </Card >
    );
};

export default TableLoader;