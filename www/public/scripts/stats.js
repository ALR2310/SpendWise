const chartCol = echarts.init(document.getElementById('stats-chart-col'), null, { renderer: 'svg' });

// Thiết lập dữ liệu mẫu
const dates = ['2024-10-20', '2024-10-21', '2024-10-22', '2024-10-23', '2024-10-24'];
const spending = [120, 200, 150, 80, 170]; // Tổng chi tiêu mỗi ngày

// Cấu hình biểu đồ
let options = {
    title: {
        text: 'Chi tiêu hàng ngày',
        left: 'center',
    },
    tooltip: {
        trigger: 'axis'
    },
    xAxis: {
        type: 'category',
        data: dates,
    },
    yAxis: {
        type: 'value',
    },
    dataZoom: [{
        type: 'slider',
        orient: 'horizontal',
        start: 10,
        end: 100
    }],
    series: [{
        data: spending,
        type: 'bar',
        barWidth: '60%',
        showSymbol: false,
        smooth: false,
        lineStyle: {
            width: 5,
            shadowColor: 'rgba(0,0,0,0.5)',
            shadowBlur: 10,
        },
    }]
};

chartCol.setOption(options);




const chartPie = echarts.init(document.getElementById('stats-chart-pie'), null, { renderer: 'svg' });

// Thiết lập dữ liệu mẫu
chartPie.setOption({
    title: {
        text: 'Các chi tiêu trong ngày',
        left: 'center'
    },
    tooltip: {
        trigger: 'item'
    },
    legend: {
        type: 'scroll',
        orient: 'vertical',
        left: 'right',
        right: 10,
        top: 20,
        bottom: 20,
        textStyle: {
            color: 'green'
        }
    },
    series: [
        {
            name: 'Access From',
            type: 'pie',
            radius: '50%',
            data: [
                { value: 1048, name: 'Search Engine' },
                { value: 735, name: 'Direct' },
                { value: 580, name: 'Email' },
                { value: 484, name: 'Union Ads' },
                { value: 300, name: 'Video Ads' }
            ],
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }
    ]
});