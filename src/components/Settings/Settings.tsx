import React, {useState} from 'react';
import {
  Box,
  Divider,
  FormControlLabel, InputLabel, MenuItem,
  Paper, Select,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {MuiFileInput} from "mui-file-input";
import Button from "@mui/material/Button";

export const Settings = () => {
  return (

    <Paper elevation={2} sx={{
      margin: '1rem 0',
      width: '98%',
      height: '90vh',
    }}>
      <Typography variant="h5" component="div" sx={{padding: 2}}>
        Настройки системы
      </Typography>

      <Divider/>

      <Typography variant="h6" component="div" sx={{padding: 2}}>
        Параметры распознавания неструктурированного текста
      </Typography>
      <Box sx={{
        display: 'flex',
        justifyContent: 'start',
        alignItems: 'center',
        padding: '1rem 2rem'
      }}>
        <Typography variant='body1' component='div' sx={{marginRight: '1rem'}}>
           Показывать этап детекции областей текста
        </Typography>
        <Switch checked={false}/>
      </Box>

      <Box sx={{
        display: 'flex',
        justifyContent: 'start',
        alignItems: 'center',
        padding: '1rem 2rem'
      }}>
        <Typography variant='body1' component='div' sx={{marginRight: '1rem'}}>
          Показывать этап распознавания текста
        </Typography>
        <Switch checked={true}/>
      </Box>

      <Grid container spacing={1} justifyContent="center">
        <Grid size={6}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'start',
            alignItems: 'center',
            padding: '1rem 2rem'
          }}>
            <Typography variant='body1' component='div' sx={{marginRight: '1rem'}}>
              Словарь для постобработки текста
            </Typography>
            <Select id="demo-simple-select" value="default" label="Словарь" variant="outlined">
              <MenuItem value="default">Словарь по умолчанию</MenuItem>
              <MenuItem value="user">Пользовательский словарь №1</MenuItem>
            </Select>
          </Box>
        </Grid>
        <Grid size={6}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'start',
            alignItems: 'center',
            padding: '1rem 2rem'
          }}>
            <Typography variant='body1' component='div' sx={{marginRight: '1rem'}}>
              Новый словарь
            </Typography>
            <MuiFileInput value={null} sx={{marginRight: '1rem'}}/>
            <Button variant="contained" disabled={true}>
              Добавить
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Divider/>
      <Typography variant="h6" component="div" sx={{padding: 2}}>
        Настройки SQL-скриптов
      </Typography>
      <Box sx={{
        display: 'flex',
        justifyContent: 'start',
        alignItems: 'baseline',
        padding: '1rem 2rem'
      }}>
        <Typography variant='body1' component='div' sx={{marginRight: '1rem'}}>
          Диалект SQL-скриптов
        </Typography>
        <ToggleButtonGroup exclusive color="primary"
                           value="1"
                           onChange={() => {
                           }}
        >
          <ToggleButton value="1">
            PostgreSQL
          </ToggleButton>
          <ToggleButton value="2">
            MS SQL Server
          </ToggleButton>
          <ToggleButton value="3">
            MySQL
          </ToggleButton>
          <ToggleButton value="4">
            SQLite
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Divider/>
    </Paper>
  );
}