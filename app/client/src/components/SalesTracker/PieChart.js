import { Pie } from "react-chartjs-2"

const PieChart = ({ title = "", labels = [], data = [], legendPosition = "left", labelsPadding = 30, currencySymbol=true }) => {
    const chartData = {
        labels,
        datasets: [
            {
                label: 'Sales (£)',
                data,
                backgroundColor: ['#4caf50','#BF3A21','#0088FE', '#FFBB28', '#FF8042', '#8884D8', '#ffffff', '#000000', '#21BABF', '#149128'],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: legendPosition,
                // align: "start",
                labels: { usePointStyle: true, padding: labelsPadding, color: 'white' },
            },
            title: {
                display: true,
                text: title,
                color: 'white',
                font: {
                    size: 16,
                    weight: 'bold'
                },
                padding: {
                    top: 10, bottom: 20
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${currencySymbol? "£":''} ${context.raw}`;
                    }
                }
            }
        },
    };
    return (<Pie options={chartOptions} data={chartData} />)
}

export default PieChart;