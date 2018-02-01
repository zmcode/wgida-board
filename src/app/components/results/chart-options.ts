import * as Highcharts from 'highcharts/js/highcharts.js';

export class ChartOptions {

    public static prColumnChart: Highcharts.Options = {
        xAxis: { categories: ['Vanilla', 'Simple', 'Splitter', 'Perfect'] },
        yAxis: [{ title: { text: null }, min: 0, max: 1, type: 'percentage' }],
        series: [
            { id: 'precision', type: 'column', name: 'Precision' },
            { id: 'recall', type: 'column', name: 'Recall' },
        ],
        plotOptions: {
            column: {
                pointPadding: 0,
            }
        },
        credits: { enabled: false }
    };

    public static ocStackedColumnChart: Highcharts.Options = {
        chart: { type: 'column' },
        xAxis: { categories: ['Vanilla', 'Simple', 'Splitter', 'Perfect'] },
        yAxis: [{
            title: { text: null },
            min: 0,
            type: 'percentage',
            stackLabels: {
                enabled: true,
                formatter: function() {
                    return Highcharts.numberFormat((this.total), 4, '.') + '%';
                }
            },
            labels: {
                format: '{value}%'
            }
        }],
        series: [
            { id: 'identify', name: 'Identify' },
            { id: 'freq_req', name: 'FreqReq' },
            { id: 'freq_rep', name: 'FreqRep' },
            { id: 'verify', name: 'Verify' },
            { id: 'active_gi', name: 'ActiveGI' },
        ],
        tooltip: {
            formatter: function () {
                return '<b>' + this.series.name + '</b>: ' +
                    Highcharts.numberFormat((this.y), 4, '.') + '%<br/>' +
                    Highcharts.numberFormat((this.y / this.point.stackTotal) * 100, 2, '.') + '% of total';
            }
        },
        plotOptions: {
            column: {
                pointPadding: 0,
                stacking: 'normal',
            }
        },
        credits: { enabled: false }
    };
}
