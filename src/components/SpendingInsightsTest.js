import React from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveSunburst } from "@nivo/sunburst";
import { ResponsiveCalendar } from "@nivo/calendar";
import { ResponsiveAreaBump } from "@nivo/bump";

// A simple component to test imports
const SpendingInsightsTest = () => {
  return (
    <Box>
      <Typography variant="h4">Test Component</Typography>
      <Paper elevation={2}>
        <Grid container>
          <Grid item xs={12}>
            <Box sx={{ height: 200 }}>
              {/* Testing if ResponsiveLine works */}
              <ResponsiveLine
                data={[
                  {
                    id: "test",
                    data: [
                      { x: "A", y: 10 },
                      { x: "B", y: 20 },
                    ],
                  },
                ]}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default SpendingInsightsTest;
