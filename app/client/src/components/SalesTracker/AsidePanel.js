import { Grid, Paper, TextField, Typography, Box } from "@mui/material";
import PieChart from "./PieChart";

const AsidePanel = ({ searchTerm, setSearchTerm, stats = [], label, title, labels, data, legendPosition }) => {
  return (
    <Grid item xs={12} md={4}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          label={label}
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Paper>
      {stats?.map((item, index) => {
        const CardIcon = item.CardIcon;
        return(
          <Paper key={index} sx={{ display:'flex', item:'center',p: 2, mb: 1, bgcolor: "secondary.main", transition: "all 0.3s ease", "&:hover": { transform: "scale(1.05)" } }}>
          <CardIcon sx={{color:'yellow', mr:3}}/>
          <Typography sx={{ fontSize: 18, fontWeight: "bold", color: "black" }}>{item.label}: {item.value}</Typography>
        </Paper>
        )
      })}
      <Box sx={{ height: "600px" }}>
        <PieChart
          title={title}
          labels={labels}
          data={data}
          legendPosition={legendPosition}
        />
      </Box>
    </Grid>
  )
}

export default AsidePanel