import React from "react";
import { ResponsiveLine } from "@nivo/line";

// Helper component for Day of Week chart
const DayOfWeekChart = ({ transactions }) => {
  // Group transactions by day of week
  const dayOfWeekData = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  transactions.forEach((transaction) => {
    if (transaction.type === "expense" && transaction.date) {
      const date = new Date(transaction.date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      dayOfWeekData[dayOfWeek] += Number(transaction.amount);
    }
  });

  const chartData = [
    {
      id: "Spending",
      data: Object.entries(dayOfWeekData).map(([day, amount]) => ({
        x: dayNames[day],
        y: amount,
      })),
    },
  ];

  return (
    <ResponsiveLine
      data={chartData}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{ type: "point" }}
      yScale={{
        type: "linear",
        min: "auto",
        max: "auto",
        stacked: false,
      }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "Day of Week",
        legendOffset: 36,
        legendPosition: "middle",
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "Amount ($)",
        legendOffset: -40,
        legendPosition: "middle",
      }}
      colors={{ scheme: "category10" }}
      pointSize={10}
      pointColor={{ theme: "background" }}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
      pointLabelYOffset={-12}
      enableArea={true}
      areaOpacity={0.15}
      useMesh={true}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 100,
          translateY: 0,
          itemsSpacing: 0,
          itemDirection: "left-to-right",
          itemWidth: 80,
          itemHeight: 20,
          itemOpacity: 0.75,
          symbolSize: 12,
          symbolShape: "circle",
          symbolBorderColor: "rgba(0, 0, 0, .5)",
          effects: [
            {
              on: "hover",
              style: {
                itemBackground: "rgba(0, 0, 0, .03)",
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
    />
  );
};

export default DayOfWeekChart;
