import React, {useState} from 'react';
import {usePythonApi} from '../../hooks/pythonBridge';
import Grid from "@mui/material/Grid2";
import {AppBar, Box, Toolbar} from "@mui/material";
import {ArrowBack, ArrowForward} from "@mui/icons-material";
import Button from "@mui/material/Button";
import {TextSaver} from "../TextSaver/TextSaver";
import {AnalysisResultsPanel} from "../utils/AnalysisResultsPanel/AnalysisResultsPanel";
import {Image} from "../../types/Image";
import {ImagePanel} from "../ImagePanel/ImagePanel";

export interface TextDetectionProps {
  step: number;
  onStepChange: (newStepIndex: number) => void;
  layout: boolean;
}

export const Digitization = (props: TextDetectionProps) => {
  const [images, setImages] = useState<Image[]>([]);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const onFilesAdd = (addedImages: Image[]) => {
    setImages([...images, ...addedImages]);
  }

  const onFileDelete = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    if (currentImgIndex === index && currentImgIndex > 0) {
      setCurrentImgIndex(index - 1);
    }
  }

  function onFilesClear() {
    setCurrentImgIndex(0);
    setImages([]);
  }

  const [activeStep, setActiveStep] = useState(props.step);
  const [awaitingBackend, setAwaitingBackend] = useState(false);
  const [canMoveToNextStep, setCanMoveToNextStep] = useState(false);

  const handleStepChange = () => {
    const oldStep = activeStep;
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setCanMoveToNextStep(false);
    props.onStepChange(oldStep + 1);
  }

  const [detectedTextAreas, setDetectedTextAreas] = useState([]);
  const handleDetectTextRequest = async () => {
    if (props.layout) {
      throw new Error("Unsupported method for layout analysis")
    }

    setAwaitingBackend(true);
    const detected = await usePythonApi('detect_text_areas', images.map(i => i.path));
    setDetectedTextAreas(detected.map(a => a['detected'].map((p, i) =>
      `(${i + 1}) x: ${p['x']}, y: ${p['y']}, w: ${p['w']}, h: ${p['h']}`
    )));

    setImages(images.map((img, i) => {
      img.data = detected[i]['image'];
      return img;
    }));
    setAwaitingBackend(false);
    setCanMoveToNextStep(true);
  }

  const [detectedLayoutElements, setDetectedLayoutElements] = useState([]);
  const handleDetectElementsRequest = async () => {
    if (!props.layout) {
      throw new Error("Unsupported method for unstructured text detection");
    }

    setAwaitingBackend(true);
    const detected = await usePythonApi('detect_structure_elements', images.map(i => i.path));
    setDetectedLayoutElements(detected.map(d => d['detected']));
    setImages(images.map((img, i) => {
      img.data = detected[i]['image'];
      return img;
    }));
    setAwaitingBackend(false);
    setCanMoveToNextStep(true);
  }

  const [recognitionResults, setRecognitionResults] = useState([]);
  const handleRecogniseTextRequest = async () => {
    setAwaitingBackend(true);
    const boxData = detectedTextAreas.length > 0 ? detectedTextAreas : null;
    const recognizedStrings = await usePythonApi(
      'recognize_text_strings', images.map(i => i.path), null, boxData
    )
    setRecognitionResults(recognizedStrings.map(rec => rec.map(s => s['string'])));
    setAwaitingBackend(false);
    setCanMoveToNextStep(true);
  }

  return (
    <Box sx={{flexGrow: 1, height: "100%", padding: '0 1rem'}}>
      {/*analysis*/}
      {activeStep < 2 &&
          <Grid container spacing={2} justifyContent="center"
                sx={{height: "100%"}}
          >
              <Grid size={9} sx={{height: '85vh'}}>
                  <ImagePanel images={images}
                              imgIndex={currentImgIndex}
                              activeStep={activeStep}
                              onFilesAdd={onFilesAdd}
                              onFileDelete={onFileDelete}
                              onFilesClear={onFilesClear}
                              onFileSelect={(_, i) => setCurrentImgIndex(i)}
                  />
              </Grid>
              <Grid size={3} sx={{height: '85vh'}}>
                  <AnalysisResultsPanel
                      analysisName={activeStep === 0 ? "детекции" : "распознавания"}
                      results={activeStep === 0 ? detectedTextAreas : recognitionResults}
                      currentImgIndex={currentImgIndex}
                      canMoveToNextStep={canMoveToNextStep}
                  />
              </Grid>
          </Grid>
      }
      {/*end analysis*/}

      {/*saving*/}
      {activeStep >= 2 &&
          <TextSaver imageNames={images.map(i => i.name)}
                     recognitionResults={recognitionResults}
                     onSave={setCanMoveToNextStep}
          />
      }
      {/*end saving*/}

      <AppBar position="fixed" color="transparent" sx={{top: 'auto', bottom: 0}}>
        <Toolbar variant="dense" sx={{justifyContent: 'space-between'}}>
          {activeStep < 2 &&
              <Button variant="contained"
                      disabled={images.length <= 0 || awaitingBackend}
                      onClick={activeStep === 0 ?
                        props.layout ? handleDetectElementsRequest :
                          handleDetectTextRequest : handleRecogniseTextRequest}
              >
                {activeStep === 0 ?
                  props.layout ? "Детектировать элементы структуры" :
                    "Детектировать области текста" : "Распознать текст"
                }
              </Button>
          }
          {activeStep === 2 &&
              <Button variant="contained" endIcon={<ArrowBack/>}
                // onClick={handleStepChange}
                // disabled={!canMoveToNextStep}
              >
                  Назад
              </Button>
          }

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
