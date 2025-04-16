import React from "react";
import { ResponsiveLine } from "@nivo/line";

// Helper component for Time of Day chart
const TimeOfDayChart = ({ transactions }) => {
  // Group transactions by hour of day
  const hourlyData = {};
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = 0;
  }

  transactions.forEach((transaction) => {
    if (transaction.type === "expense" && transaction.date) {
      const date = new Date(transaction.date);
      const hour = date.getHours();
      hourlyData[hour] += Number(transaction.amount);
    }
  });

  const chartData = [
    {
      id: "Spending by Hour",
      data: Object.entries(hourlyData).map(([hour, amount]) => ({
        x: formatHour(parseInt(hour)),
        y: amount,
      })),
    },
  ];

  function formatHour(hour) {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  }

  return (
    <ResponsiveLine
      data={chartData}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{ type: "point" }}
      yScale={{
        type: "linear",
        min: "auto",
        max: "auto",
        stacked: true,
      }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 45,
        legend: "Time of Day",
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
      enablePoints={true}
      pointSize={4}
      pointColor={{ theme: "background" }}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
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

export default TimeOfDayChart; 