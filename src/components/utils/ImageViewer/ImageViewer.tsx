import React, {useState} from "react";
import {Box, Divider, Paper, Tab, Tabs} from "@mui/material";
import {TabContent} from "../TabContent/TabContent";
import {Image} from "../../../types/Image";

export const ImageViewer = (props: {
  images: Image[],
  imgIndex: number,
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(props.imgIndex);
  const showImage = (event: React.SyntheticEvent, newIndex: number) => {
    setCurrentImgIndex(newIndex);
  }

  return <Box sx={{width: "100%", height: "100%"}}>
    <Paper elevation={1} sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      height: "100%"
    }}>
      <Box sx={{width: "100%", height: "100%"}}>
        {props.images.map((img, i) =>
          <TabContent key={i} selectedTabIndex={currentImgIndex} tabIndex={i}>
            <img
              src={`data:image/png;base64,${img.data}`} alt={img.name}
              style={{maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block', margin: '0 auto'}}
            />
          </TabContent>)}
      </Box>
      <Divider/>
      <Tabs
        value={currentImgIndex}
        onChange={showImage}
        variant="scrollable"
        scrollButtons="auto"
        sx={{maxWidth: "65vw"}}
      >
        {props.images.map((img, i) => <Tab key={i} label={img.name}/>)}
      </Tabs>
    </Paper>
  </Box>;
}
