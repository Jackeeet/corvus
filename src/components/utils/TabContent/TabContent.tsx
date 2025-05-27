import React from 'react';
import {Box} from "@mui/material";

export interface TabContentProps {
  children?: React.ReactNode;
  selectedTabIndex: number;
  tabIndex: number;
}

export const TabContent = (props: TabContentProps) => {
  const {children, tabIndex, selectedTabIndex, ...other} = props;

  return (
    <div role="tabpanel"
         hidden={tabIndex !== selectedTabIndex}
         id={`tab-content-${selectedTabIndex}`}
         {...other}
    >
      {tabIndex === selectedTabIndex &&
          <Box sx={{p: 1}}>
            {children}
          </Box>
      }
    </div>
  );
};
