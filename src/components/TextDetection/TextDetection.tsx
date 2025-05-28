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

  const [awaitingBackend, setAwaitingBackend] = useState(false);

  const [detectionResults, setDetectionResults] = useState([]);
  const handleDetectTextRequest = async () => {
    setAwaitingBackend(true);
    const detectedAreas = await usePythonApi('detect_text_areas', imgFilePaths);
    setDetectionResults(detectedAreas.map(a => a['detected'].map(p =>
      `x: ${p['x']}, y: ${p['y']}, w: ${p['w']}, h: ${p['h']}`
    )));
    setImgFilesData(detectedAreas.map(a => a['image']));
    setAwaitingBackend(false);
    setCanMoveToNextStep(true);
  }

  const [recognitionResults, setRecognitionResults] = useState([]);
  const handleRecogniseTextRequest = async () => {
    setAwaitingBackend(true);
    const boxData = detectionResults.length > 0 ? detectionResults : null;
    const recognizedStrings = await usePythonApi(
      'recognize_text_strings',
      imgFilePaths, null, boxData
    )
    setRecognitionResults(recognizedStrings.map(rec => rec.map(s => s['string'])));
    setAwaitingBackend(false);
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
                        zIndex: 10000
                      }}>
                        {activeStep === 0 &&
                            <Button variant="contained" sx={{width: '100%', zIndex: 10000}}
                                    disabled={imgFileNames.length <= 0 || awaitingBackend}
                                    onClick={handleDetectTextRequest}
                            >
                                Детектировать области текста
                            </Button>
                        }
                        {activeStep === 1 &&
                            <Button variant="contained" sx={{width: '100%', zIndex: 10000}}
                                    disabled={imgFileNames.length <= 0 || awaitingBackend}
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
