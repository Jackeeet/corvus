import {Box, Divider, IconButton, List, ListItem, ListItemButton, ListItemText, Paper, Typography} from "@mui/material";
import {ContentCopy} from "@mui/icons-material";

export interface AnalysisResultsPanelProps {
  analysisName: string;
  results: string[][];
  currentImgIndex: number;
  canMoveToNextStep: boolean;
}

export const AnalysisResultsPanel = (props: AnalysisResultsPanelProps) => {
  return (
    <Paper elevation={2} sx={{margin: '1rem 0'}}>
      <Box sx={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem'}}>
        <Typography variant="h5" component="div" sx={{padding: 1}}>
          Результаты {props.analysisName}
        </Typography>
        <IconButton color="primary"
                    disabled={props.results[props.currentImgIndex]?.length <= 0}
        >
          <ContentCopy/>
        </IconButton>
      </Box>
      <Divider/>

      <Box sx={{height: '80vh', overflow: 'auto'}}>
        <List dense={true}>
          {props.canMoveToNextStep &&
            props.results[props.currentImgIndex]?.map((result, i) =>
              <ListItem key={i}>
                <ListItemButton selected={null}>
                  <ListItemText primary={result} secondary={null}/>
                </ListItemButton>
              </ListItem>
            )}
        </List>
      </Box>
    </Paper>
  );
};