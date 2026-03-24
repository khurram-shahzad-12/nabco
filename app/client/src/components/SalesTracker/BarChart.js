import { Box, Paper } from "@mui/material";
import { Bar } from "react-chartjs-2"

const BarChart = ({title="", labels = [], data1 = [], data2 = [], datasetLabel1 = "", datasetLabel2 = "", height = 550}) => {
     const chartData = {
        labels,
        datasets: [
            {
                label: datasetLabel1,
                data: data1,
                backgroundColor: '#3f51b5',
            },
            {
                label: datasetLabel2,
                data: data2,
                backgroundColor: '#82ca9d',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: data2.length > 0 ? true : false,
                position: 'top',
                labels: { color: 'white' }
            },
            title: {
                display: true,
                text: title,
                color: 'white',
                font: { size: 16, weight: "bold" }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: 'white' },
                grid: { color: "white", borderColor: "white" }
            },
            x: {
                ticks: { color: 'white' },
                grid: { color: "white", borderColor: "white" }
            }
        },
    };

  return (
    <Paper sx={{ p: 2, mb: 2, height }}><Box sx={{ width: "100%", height: "100%" }}><Bar options={chartOptions} data={chartData}/></Box></Paper>  
  )
}

export default BarChart