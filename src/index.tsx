import React, {useState} from 'react'
import ReactDOM from 'react-dom';

import Button from '@mui/material/Button';
import {AppBar, Box, Step, StepLabel, Stepper, Toolbar, Typography} from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings';

import './index.css'
import {MainMenu} from "./components/MainMenu/MainMenu";
import {Digitization} from "./components/Digitization/Digitization";
import {Settings} from "./components/Settings/Settings";
import {ArrowBack} from "@mui/icons-material";

enum AppMode {
  MainMenu,
  TextDetection,
  ElementsDetection,
  Settings
}

interface AppProps {
  pywebview: string;
}

const App = (props: AppProps) => {
  const [appMode, setAppMode] = useState(AppMode.MainMenu);
  const changeAppMode = (newAppMode: AppMode) => {
    setAppMode(newAppMode);
  }

  const [stepIndex, setStepIndex] = useState(0);
  const handleStepChange = (newStepIndex: number) => {
    if (newStepIndex > 2) {
      setStepIndex(0);
      setAppMode(AppMode.MainMenu);
    } else {
      setStepIndex(newStepIndex);
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <AppBar position="static" color="transparent" sx={{flexShrink: 0}}>
        <Toolbar variant="dense">
          {appMode === AppMode.MainMenu &&
              <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                  corvus
              </Typography>
          }
          {appMode !== AppMode.MainMenu &&
              <Box sx={{
                flexGrow: appMode === AppMode.Settings ? 1 : 0.5
              }}>
                  <Button color='inherit' startIcon={<ArrowBack/>}
                          onClick={() => changeAppMode(AppMode.MainMenu)}
                  >
                      Главное меню
                  </Button>
              </Box>
          }

          {(appMode === AppMode.TextDetection || appMode === AppMode.ElementsDetection) &&
              <Stepper activeStep={stepIndex} sx={{flexGrow: 1}}>
                  <Step key="detection" completed={stepIndex > 0}>
                      <StepLabel>
                          Детекция {
                        appMode === AppMode.TextDetection ? "областей текста" : "элементов структуры"
                      }
                      </StepLabel>
                  </Step>
                  <Step key="recognition" completed={stepIndex > 1}>
                      <StepLabel>Распознавание текста</StepLabel>
                  </Step>
                  <Step key="saving" completed={stepIndex > 2}>
                      <StepLabel>Сохранение результатов</StepLabel>
                  </Step>
              </Stepper>
          }

          {appMode !== AppMode.Settings &&
              <Button color="inherit" endIcon={<SettingsIcon/>}
                      onClick={() => changeAppMode(AppMode.Settings)}
                      sx={{flexGrow: 0.5, justifyContent: 'end'}}
              >
                  Настройки
              </Button>
          }
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {appMode === AppMode.MainMenu &&
            <MainMenu
                onTextDetectionClick={() => changeAppMode(AppMode.TextDetection)}
                onStructureAnalysisClick={() => changeAppMode(AppMode.ElementsDetection)}
            />
        }
        {appMode === AppMode.TextDetection &&
            <Digitization step={stepIndex} onStepChange={handleStepChange} layout={false}/>
        }
        {appMode === AppMode.ElementsDetection &&
            <Digitization step={stepIndex} onStepChange={handleStepChange} layout={true}/>
        }
        {appMode === AppMode.Settings &&
            <Settings/>
        }
      </Box>
    </div>
  )
}

const view = <App pywebview='pywebview'/>;

const element = document.getElementById('app')
ReactDOM.render(view, element)