import React, {useState} from 'react';
import {usePythonApi} from '../../hooks/pythonBridge'
import Grid from "@mui/material/Grid2";
import {
  AppBar,
  Box, Divider, IconButton,
  List, ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Tab,
  Tabs, Toolbar,
  Typography
} from "@mui/material";
import {Add, ArrowForward, ArtTrack, ContentCopy, Delete} from "@mui/icons-material";
import Button from "@mui/material/Button";
import {TextSaver} from "../TextSaver/TextSaver";
import {TabContent} from "../utils/TabContent/TabContent";
import {AnalysisResultsPanel} from "../AnalysisResultsPanel/AnalysisResultsPanel";

export interface TextDetectionProps {
  step: number;
  onStepChange: (newStepIndex: number) => void;
}

interface Image {
  name: string;
  path: string;
  data: string;
}

export const TextDetection = (props: TextDetectionProps) => {
  const [imgFileNames, setImgFileNames] = useState<string[]>([]);
  const [imgFilePaths, setImgFilePaths] = useState<string[]>([]);
  const [imgFilesData, setImgFilesData] = useState<string[]>([]);
  const [imgFilesWithBboxes, setImgFilesWithBboxes] = useState<string[]>([]);

  const handleAddImgFile = async () => {
    const result: Image[] = await usePythonApi('open_file_dialog');
    if (result.length > 0) {
      const newFileNames = result.map((file) => file.name);
      const newFilePaths = result.map((file) => file.path);
      const newFilesData = result.map((file) => file.data);
      setImgFileNames([...imgFileNames, ...newFileNames]);
      setImgFilePaths([...imgFilePaths, ...newFilePaths]);
      setImgFilesData([...imgFilesData, ...newFilesData]);
    }
  };

  const handleDeleteImgFile = (index: number) => {
    setImgFileNames(imgFileNames.filter((_, i) => i !== index));
    setImgFilesData(imgFilesData.filter((_, i) => i !== index));
    if (currentImgIndex === index && currentImgIndex > 0) {
      setCurrentImgIndex((i) => i - 1);
    }
  };

  const handleClearImgFiles = () => {
    setImgFileNames([]);
    setImgFilePaths([]);
    setImgFilesData([]);
  };

  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const showImage = (event: React.SyntheticEvent, newIndex: number) => {
    setCurrentImgIndex(newIndex);
  }

  const [activeStep, setActiveStep] = useState(props.step);
  const [canMoveToNextStep, setCanMoveToNextStep] = useState(false);

  const handleStepChange = () => {
    const oldStep = activeStep;
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setCanMoveToNextStep(false);
    props.onStepChange(oldStep + 1);
  }

  const [detectionResults, setDetectionResults] = useState([]);
  const handleDetectTextRequest = async () => {
    const detectedAreas = await usePythonApi('detect_text_areas', imgFilePaths);
    setDetectionResults(detectedAreas.map(a => a['detected']['res']['dt_polys'].map(p =>
      `(${p[0][0]}, ${p[0][1]}), (${p[1][0]}, ${p[1][1]}), (${p[2][0]}, ${p[2][1]}), (${p[3][0]}, ${p[3][1]})`
    )));
    setImgFilesWithBboxes(detectedAreas.map(a => a['image']));
    setImgFilesData(detectedAreas.map(a => a['image']));
    setCanMoveToNextStep(true);
  }

  const [recognitionResults, setRecognitionResults] = useState([]);
  const handleRecogniseTextRequest = () => {
    // call python text recognition (custom NN) here
    setCanMoveToNextStep(true);
  }

  return (
    <Box sx={{flexGrow: 1, height: "100%", padding: '0 1rem'}}>
      {/*analysis*/}
      {activeStep < 2 &&
          <Grid container spacing={2} justifyContent="center">
              <Grid size={4} sx={{height: '80vh'}}>
                  <Paper elevation={2} sx={{margin: '1rem 0'}}>
                      <Box sx={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem'}}>
                          <Typography variant="h5" component="div" sx={{padding: 1}}>
                              Изображения
                          </Typography>
                        {activeStep === 0 &&
                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                <Button variant="outlined" startIcon={<Add/>} sx={{marginRight: '1rem'}}
                                        onClick={handleAddImgFile}
                                >
                                    Добавить
                                </Button>
                                <Button variant="outlined" startIcon={<Delete/>} color="error"
                                        onClick={handleClearImgFiles}
                                        disabled={imgFileNames.length <= 0}
                                >
                                    Удалить все
                                </Button>
                            </Box>
                        }
                      </Box>
                      <Divider/>

                      <Box sx={{height: '75vh', overflow: 'auto'}}>
                          <List dense={true}>
                            {imgFileNames.map((imgName, i) =>
                              <ListItem key={i}
                                        secondaryAction={
                                          (activeStep === 0) && <IconButton edge="end"
                                                                            onClick={() => handleDeleteImgFile(i)}
                                            >
                                                <Delete/>
                                            </IconButton>
                                        }
                              >
                                <ListItemButton selected={currentImgIndex === i}
                                                onClick={(event) => showImage(event, i)}
                                >
                                  <ListItemIcon>
                                    <ArtTrack/>
                                  </ListItemIcon>
                                  <ListItemText primary={imgName} secondary={null}/>
                                </ListItemButton>
                              </ListItem>
                            )}
                          </List>
                      </Box>

                      <Divider/>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                      }}>
                        {activeStep === 0 &&
                            <Button variant="contained" sx={{width: '100%'}}
                                    disabled={imgFileNames.length <= 0}
                                    onClick={handleDetectTextRequest}
                            >
                                Детектировать области текста
                            </Button>
                        }
                        {activeStep === 1 &&
                            <Button variant="contained" sx={{width: '100%'}}
                                    disabled={imgFileNames.length <= 0}
                                    onClick={handleRecogniseTextRequest}
                            >
                                Распознать текст
                            </Button>
                        }
                      </Box>
                  </Paper>
              </Grid>

              <Grid size={6} sx={{height: '88vh'}}>
                  <Paper elevation={2} sx={{
                    margin: '1rem 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%'
                  }}>
                      <Box sx={{width: '100%', height: '100%'}}>
                        {
                          imgFileNames.map((imgName, i) =>
                            <TabContent key={i} selectedTabIndex={currentImgIndex} tabIndex={i}>
                              <img
                                src={`data:image/png;base64,${imgFilesData[i]}`}
                                alt={imgName}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '75vh',
                                  objectFit: 'contain',
                                  display: 'block',
                                  margin: '0 auto'
                                }}
                              />
                            </TabContent>
                          )
                        }
                      </Box>
                      <Divider/>
                      <Tabs
                          value={currentImgIndex}
                          onChange={showImage}
                          variant="scrollable"
                          scrollButtons="auto"
                          sx={{maxWidth: '65vw'}}
                      >
                        {imgFileNames.map((imgName, i) => <Tab key={i} label={imgName}/>)}
                      </Tabs>
                  </Paper>
              </Grid>

              <Grid size={2} sx={{height: '88vh'}}>
                  <AnalysisResultsPanel
                      analysisName={activeStep === 0 ? "детекции" : "распознавания"}
                      results={activeStep === 0 ? detectionResults : recognitionResults}
                      currentImgIndex={currentImgIndex}
                      canMoveToNextStep={canMoveToNextStep}
                  />
                {/*<Paper elevation={2} sx={{margin: '1rem 0'}}>*/}
                {/*    <Box sx={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem'}}>*/}
                {/*        <Typography variant="h5" component="div" sx={{padding: 1}}>*/}
                {/*            Результаты {activeStep === 0 ? "детекции" : "распознавания"}*/}
                {/*        </Typography>*/}
                {/*        <IconButton color="primary"*/}
                {/*                    disabled={analysisResults[currentImgIndex]?.length <= 0}*/}
                {/*        >*/}
                {/*            <ContentCopy/>*/}
                {/*        </IconButton>*/}
                {/*    </Box>*/}
                {/*    <Divider/>*/}

                {/*    <Box sx={{height: '80vh', overflow: 'auto'}}>*/}
                {/*        <List dense={true}>*/}
                {/*          {canMoveToNextStep && analysisResults[currentImgIndex]?.map((result, i) =>*/}
                {/*            <ListItem key={i}>*/}
                {/*              <ListItemButton selected={null}>*/}
                {/*                <ListItemText primary={result} secondary={null}/>*/}
                {/*              </ListItemButton>*/}
                {/*            </ListItem>*/}
                {/*          )}*/}
                {/*        </List>*/}
                {/*    </Box>*/}
                {/*</Paper>*/}
              </Grid>
          </Grid>
      }
      {/*end analysis*/}

      {/*saving*/}
      {activeStep >= 2 &&
          <TextSaver imageNames={imgFileNames}
                     recognitionResults={recognitionResults}
                     onSave={setCanMoveToNextStep}
          />
      }

      <AppBar position="fixed" color="transparent" sx={{top: 'auto', bottom: 0}}>
        <Toolbar variant="dense" sx={{justifyContent: 'end'}}>
          <Button variant="contained" endIcon={<ArrowForward/>}
                  onClick={handleStepChange}
                  disabled={!canMoveToNextStep}
          >
            {activeStep < 2 ? 'Далее' : 'Завершить'}
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
};
