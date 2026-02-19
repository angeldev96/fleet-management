import React from "react";
import { cn } from "lib/utils";

export default function CustomTable({
  tableHead,
  tableData,
  tableHeaderColor,
  hover,
  colorsColls,
  coloredColls,
  customCellClasses,
  customClassesForCells,
  striped,
  tableShopping,
  customHeadCellClasses,
  customHeadClassesForCells,
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        {tableHead !== undefined ? (
          <thead className="border-b">
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
                      "h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap uppercase tracking-wider text-xs bg-muted/50",
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
          {tableData.map((prop, key) => {
            var rowColor = "";
            var rowColored = false;
            if (prop.color !== undefined) {
              rowColor = prop.color;
              rowColored = true;
              prop = prop.data;
            }
            if (prop.total) {
              return (
                <tr key={key} className="border-b font-medium">
                  <td className="p-3" colSpan={prop.colspan} />
                  <td className="p-3 text-right">Total</td>
                  <td className="p-3">{prop.amount}</td>
                  {tableHead.length - (prop.colspan - 0 + 2) > 0 ? (
                    <td className="p-3" colSpan={tableHead.length - (prop.colspan - 0 + 2)} />
                  ) : null}
                </tr>
              );
            }
            if (prop.purchase) {
              return (
                <tr key={key} className="border-b">
                  <td className="p-3" colSpan={prop.colspan} />
                  <td className="p-3 text-right" colSpan={prop.col.colspan}>
                    {prop.col.text}
                  </td>
                </tr>
              );
            }
            return (
              <tr
                key={key}
                className={cn(
                  "border-b transition-colors",
                  "hover:bg-muted/50",
                  striped && key % 2 === 0 && "bg-muted/30",
                )}
              >
                {prop.map((cellProp, cellKey) => {
                  const extraCellClass =
                    customClassesForCells &&
                    customCellClasses &&
                    customClassesForCells.indexOf(cellKey) !== -1
                      ? customCellClasses[customClassesForCells.indexOf(cellKey)]
                      : "";
                  return (
                    <td className={cn("p-3 align-middle", extraCellClass)} key={cellKey}>
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

CustomTable.defaultProps = {
  tableHeaderColor: "gray",
  hover: false,
  colorsColls: [],
  coloredColls: [],
  striped: false,
  customCellClasses: [],
  customClassesForCells: [],
  customHeadCellClasses: [],
  customHeadClassesForCells: [],
};
