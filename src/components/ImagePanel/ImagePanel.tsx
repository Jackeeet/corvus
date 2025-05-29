import React from 'react';
import {usePythonApi} from '../../hooks/pythonBridge';
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon, ListItemText,
  Paper,
  Typography
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Button from "@mui/material/Button";
import {Add, ArtTrack, Delete} from "@mui/icons-material";
import {Image} from "../../types/Image";
import {ImageViewer} from "../utils/ImageViewer/ImageViewer";

export const ImagePanel = (props: {
  images: Image[],
  imgIndex: number,
  activeStep: number,
  onFilesAdd: (addedImages: Image[]) => void,
  onFileDelete: (index: number) => void,
  onFilesClear: () => void,
  onFileSelect: (event: any, i: number) => void,
}) => {
  const handleAddImage = async () => {
    const result: Image[] = await usePythonApi('open_file_dialog');
    if (result.length > 0) {
      props.onFilesAdd(result);
    }
  };
  const handleClearImages = () => props.onFilesClear();

  return <Box sx={{height: "100%", margin: '1rem 0'}}>
    <Paper elevation={2}>
      <Box sx={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem'}}>
        <Typography variant="h5" component="div" sx={{padding: 1}}>
          Изображения
        </Typography>
        {props.activeStep === 0 &&
            <Box sx={{display: 'flex', alignItems: 'center'}}>
                <Button variant="outlined" startIcon={<Add/>} sx={{marginRight: '1rem'}}
                        onClick={handleAddImage}
                >
                    Добавить
                </Button>
                <Button variant="outlined" startIcon={<Delete/>} color="error"
                        disabled={props.images.length <= 0}
                        onClick={handleClearImages}
                >
                    Удалить все
                </Button>
            </Box>
        }
      </Box>
      <Divider/>
      <Grid container sx={{height: "100%", justifyContent: 'space-between'}}>
        <Grid size={4}>
          <Box sx={{height: '80vh', overflow: 'auto'}}>
            <List dense={true}>
              {props.images.map((img, i) =>
                <ListItem key={i} secondaryAction={(props.activeStep === 0) &&
                    <IconButton edge="end" onClick={() => props.onFileDelete(i)}>
                        <Delete/>
                    </IconButton>
                }>
                  <ListItemButton selected={props.imgIndex === i}
                                  onClick={(event) => props.onFileSelect(event, i)}
                  >
                    <ListItemIcon>
                      <ArtTrack/>
                    </ListItemIcon>
                    <ListItemText primary={img.name} secondary={null}/>
                  </ListItemButton>
                </ListItem>
              )}
            </List>
          </Box>
        </Grid>
        <Grid size={8}>
          <ImageViewer images={props.images} imgIndex={props.imgIndex}/>
        </Grid>
      </Grid>
    </Paper>
  </Box>;
};