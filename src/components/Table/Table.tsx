import React from "react";
import { cn } from "lib/utils";

interface CustomTableProps {
  tableHead?: string[];
  tableData: any[];
  tableHeaderColor?: string;
  hover?: boolean;
  colorsColls?: string[];
  coloredColls?: number[];
  customCellClasses?: string[];
  customClassesForCells?: number[];
  striped?: boolean;
  tableShopping?: boolean;
  customHeadCellClasses?: string[];
  customHeadClassesForCells?: number[];
}

export default function CustomTable({
  tableHead,
  tableData,
  tableHeaderColor = "gray",
  hover = false,
  colorsColls = [],
  coloredColls = [],
  customCellClasses = [],
  customClassesForCells = [],
  striped = false,
  tableShopping,
  customHeadCellClasses = [],
  customHeadClassesForCells = [],
}: CustomTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
        {tableHead !== undefined ? (
          <thead>
            <tr>
              {tableHead.map((prop, key) => {
                const extraClass =
                  customHeadClassesForCells &&
                  customHeadCellClasses &&
                  customHeadClassesForCells.indexOf(key) !== -1
                    ? customHeadCellClasses[customHeadClassesForCells.indexOf(key)]
                    : "";
                return (
                  <th
                    className={cn(
                      "h-11 px-4 text-left align-middle font-semibold text-muted-foreground/80 whitespace-nowrap uppercase tracking-[0.05em] text-[11px] border-b border-border/60 bg-muted/30",
                      key === 0 && "rounded-tl-lg",
                      key === tableHead.length - 1 && "rounded-tr-lg",
                      extraClass,
                    )}
                    key={key}
                  >
                    {prop}
                  </th>
                );
              })}
            </tr>
          </thead>
        ) : null}
        <tbody className="[&_tr:last-child]:border-0">
          {tableData.map((prop: any, key: number) => {
            let rowColor = "";
            let rowColored = false;
            if (prop.color !== undefined) {
              rowColor = prop.color;
              rowColored = true;
              prop = prop.data;
            }
            if (prop.total) {
              return (
                <tr key={key} className="border-b border-border/40 font-medium">
                  <td className="px-4 py-3.5" colSpan={prop.colspan} />
                  <td className="px-4 py-3.5 text-right">Total</td>
                  <td className="px-4 py-3.5">{prop.amount}</td>
                  {tableHead && tableHead.length - (prop.colspan - 0 + 2) > 0 ? (
                    <td className="px-4 py-3.5" colSpan={tableHead.length - (prop.colspan - 0 + 2)} />
                  ) : null}
                </tr>
              );
            }
            if (prop.purchase) {
              return (
                <tr key={key} className="border-b border-border/40">
                  <td className="px-4 py-3.5" colSpan={prop.colspan} />
                  <td className="px-4 py-3.5 text-right" colSpan={prop.col.colspan}>
                    {prop.col.text}
                  </td>
                </tr>
              );
            }
            return (
              <tr
                key={key}
                className={cn(
                  "border-b border-border/40 transition-colors duration-150",
                  "hover:bg-primary/3",
                  striped && key % 2 === 0 && "bg-muted/20",
                )}
              >
                {prop.map((cellProp: any, cellKey: number) => {
                  const extraCellClass =
                    customClassesForCells &&
                    customCellClasses &&
                    customClassesForCells.indexOf(cellKey) !== -1
                      ? customCellClasses[customClassesForCells.indexOf(cellKey)]
                      : "";
                  return (
                    <td className={cn("px-4 py-3.5 align-middle", extraCellClass)} key={cellKey}>
                      {cellProp}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
