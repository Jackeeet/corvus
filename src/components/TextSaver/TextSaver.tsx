import React, {useState} from 'react';
import Grid from "@mui/material/Grid2";
import {
  Box,
  Divider,
  List, ListItem, ListItemButton, ListItemText,
  Paper, Tab, Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import {MuiFileInput} from "mui-file-input";
import Button from "@mui/material/Button";
import {TabContent} from "../utils/TabContent/TabContent";

interface TextSaverProps {
  imageNames: string[];
  recognitionResults: string[][];
  onSave: (success: boolean) => void;
}

type FileMode = 'single' | 'separate';
type FileFormat = 'txt' | 'csv' | 'sql';

export const TextSaver = (props: TextSaverProps) => {
  const [fileMode, setFileMode] = useState<FileMode>('single');
  const updateFileMode = (event: React.MouseEvent<HTMLElement>, newMode: FileMode) => {
    setFileMode(newMode);
  }

  const [filePath, setFilePath] = useState(null);
  const handleFilePathChange = (value: File) => {
    setFilePath(value);
  }

  const [fileFormat, setFileFormat] = useState<FileFormat>('txt');
  const updateFileFormat = (event: React.MouseEvent<HTMLElement>, newFormat: FileFormat) => {
    setFileFormat(newFormat);
  }

  const [currentResultPageIndex, setCurrentResultPageIndex] = useState(0);
  const showResultPage = (event: React.SyntheticEvent, newPageIndex: number) => {
    setCurrentResultPageIndex(newPageIndex);
  }

  const handleSaveRequest = () => {
    props.onSave(true);
  }

  return (
    <Grid container spacing={2} justifyContent="center">
      <Grid size={7} sx={{}}>
        <Paper elevation={2} sx={{
          margin: '1rem 0',
        }}>
          <Typography variant="h5" component="div" sx={{padding: 2}}>
            Сохранение результатов анализа
          </Typography>

          <Divider/>

          <Grid container spacing={1} justifyContent="center" sx={{padding: '1.25rem'}}>
            <Grid size={7} sx={{marginBottom: '1rem'}}>
              <Box sx={{display: 'flex', justifyContent: 'start', alignItems: 'baseline'}}>
                <Typography variant='h6' component='div' sx={{marginRight: '1rem'}}>
                  Сохранять распознанный текст в
                </Typography>
                <ToggleButtonGroup exclusive color="primary"
                                   value={fileMode}
                                   onChange={updateFileMode}
                >
                  <ToggleButton value="single">
                    Общий файл
                  </ToggleButton>
                  <ToggleButton value="separate">
                    Отдельные файлы
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>
            <Grid size={5} sx={{marginBottom: '1rem'}}>
              <Box sx={{display: 'flex', justifyContent: 'start', alignItems: 'baseline'}}>
                <Typography variant='h6' component='div' sx={{marginRight: '1rem'}}>
                  Формат {fileMode === 'single' ? 'файла' : 'файлов'}:
                </Typography>
                <ToggleButtonGroup exclusive color="primary"
                                   value={fileFormat}
                                   onChange={updateFileFormat}
                >
                  <ToggleButton value="txt">TXT</ToggleButton>
                  <ToggleButton value="csv">CSV</ToggleButton>
                  <ToggleButton value="sql">SQL</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>
            <Grid size={12} sx={{marginBottom: '1rem'}}>
              <Box sx={{display: 'flex', justifyContent: 'start', alignItems: 'baseline'}}>
                <Typography variant='h6' component='div' sx={{marginRight: '1rem'}}>
                  Путь к {fileMode === 'single' ? 'файлу' : 'папке'}:
                </Typography>
                <MuiFileInput value={filePath} onChange={handleFilePathChange}/>
              </Box>
            </Grid>

            {fileMode === 'separate' &&
                <Grid size={12} sx={{marginBottom: '1rem'}}>
                    <Box sx={{display: 'flex', justifyContent: 'start', alignItems: 'baseline'}}>
                        <Typography variant='h6' component='div' sx={{marginRight: '1rem'}}>
                            Шаблон для названий файлов
                        </Typography>
                        <TextField variant="outlined" sx={{width: "60%"}}/>
                    </Box>
                </Grid>
            }

            {fileFormat === 'sql' && <>
                <Grid size={6} sx={{marginBottom: '1rem'}}>
                    <Box sx={{display: 'flex', justifyContent: 'start', alignItems: 'baseline'}}>
                        <Typography variant='h6' component='div' sx={{marginRight: '1rem'}}>
                            Название таблицы
                        </Typography>
                        <TextField variant="outlined" sx={{width: "60%"}}/>
                    </Box>
                </Grid>
                <Grid size={6} sx={{marginBottom: '1rem'}}>
                    <Box sx={{display: 'flex', justifyContent: 'start', alignItems: 'baseline'}}>
                        <Typography variant='h6' component='div' sx={{marginRight: '1rem'}}>
                            Название столбца
                        </Typography>
                        <TextField variant="outlined" sx={{width: "60%"}}/>
                    </Box>
                </Grid>
            </>
            }
          </Grid>

          <Divider/>

          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
          }}>
            <Button variant="contained" sx={{width: '100%'}}
                    disabled={false}
                    onClick={handleSaveRequest}
            >
              Сохранить
            </Button>
          </Box>
        </Paper>
      </Grid>

      <Grid size={5} sx={{height: '90vh'}}>
        <Paper elevation={2} sx={{margin: '1rem 0'}}>
          <Box sx={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem'}}>
            <Typography variant="h5" component="div" sx={{padding: 1}}>
              Результаты распознавания
            </Typography>
          </Box>

          <Divider/>

          <Box sx={{height: '75vh', overflow: 'auto'}}>
            {props.recognitionResults.map((r, i) =>
              <TabContent key={i} selectedTabIndex={currentResultPageIndex} tabIndex={i}>
                <List dense={true}>
                  {r.map((result, i) =>
                    <ListItem key={i}>
                      <ListItemButton selected={null}>
                        <ListItemText primary={result} secondary={null}/>
                      </ListItemButton>
                    </ListItem>
                  )}
                </List>
              </TabContent>
            )}
          </Box>
          <Divider/>
          <Tabs value={currentResultPageIndex}
                onChange={showResultPage}
                variant="scrollable"
                scrollButtons="auto"
          >
            {props.imageNames.map((imgName, i) =>
              <Tab key={i} label={imgName}/>)
            }
          </Tabs>
        </Paper>
      </Grid>
    </Grid>
  );
}