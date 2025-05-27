import React from "react";
import Grid from "@mui/material/Grid2";
import Button from "@mui/material/Button";

export interface MainMenuProps {
  onTextDetectionClick: () => void;
  onStructureAnalysisClick: () => void;
}

export const MainMenu = (props: MainMenuProps) => {
  return (
    <Grid container spacing={2} justifyContent="center">
      <Button
        variant="contained"
        sx={{
          width: 300,
          height: 200,
          fontSize: "16px",
          fontWeight: "bold",
          textTransform: "none",
        }}
        onClick={props.onTextDetectionClick}
      >
        Оцифровка неструктурированного документа
      </Button>
      <Button
//         disabled={true}
        variant="contained"
        sx={{
          width: 300,
          height: 200,
          fontSize: "16px",
          fontWeight: "bold",
          textTransform: "none",
        }}
        onClick={props.onStructureAnalysisClick}
      >
        Оцифровка структурированного документа
      </Button>
    </Grid>
  );
};
