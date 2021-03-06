import { IDatasetFilters } from 'app/components/dataset/dataset.component';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Simulation } from 'app/models/simulation.model';
import * as Highcharts from 'highcharts/js/highcharts.js';
import { assign, keys } from 'lodash';
import { ChartOptions } from './chart-options';
import { GlobalIceberg } from 'app/models/global-iceberg.model';
import { HeatmapOptions } from 'app/components/results/heatmap/heatmap.component';
import { DatasetService } from 'app/services/dataset/dataset.service';
import { StackedAreaOptions } from 'app/components/results/stacked-area/stacked-area.component';
import { ChartUtils } from 'app/utils/ChartUtils';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit, OnDestroy {

  private algorithms = ['van', 'sim', 'spl', 'per'];
  private messages = ['identify', 'freq_req', 'freq_rep', 'verify', 'active_gi'];

  simulations: Simulation[];
  filters: IDatasetFilters;

  loaders = {
    prOverall: false,
    prHeatmaps: false,
    commOverall: false,
    commWindows: false,
    commThresholds: false,
  };

  options = {
    prColumnChartSliding: assign({
      title: { text: 'Global Iceberg detection in sliding windows *' }
    }, ChartOptions.prColumnChart),
    prColumnChartDetected: assign({
      title: { text: 'Global Iceberg detection over whole simulation **' }
    }, ChartOptions.prColumnChart),
    ocMessages: assign({
      title: { text: 'Exchanged messages as percentage of the stream size' }
    }, ChartOptions.ocStackedColumnChart),
    ocPayloads: assign({
      title: { text: 'Exchanged payloads as percentage of the stream size' }
    }, ChartOptions.ocStackedColumnChart)
  };

  prColumnChartSliding: Highcharts.ChartObject;
  prColumnChartDetected: Highcharts.ChartObject;
  ocMessagesChart: Highcharts.ChartObject;
  ocPayloadsChart: Highcharts.ChartObject;

  heatmaps: HeatmapOptions[] = [{
    xTitle: 'Shifts', xCategories: [],
    yTitle: 'Windows', yCategories: [],
    data: { van: [[], []], sim: [[], []], spl: [[], []], per: [[], []] }
  }, {
    xTitle: 'Windows', xCategories: [],
    yTitle: 'Thresholds', yCategories: [],
    data: { van: [[], []], sim: [[], []], spl: [[], []], per: [[], []] }
  }];

  stackedAreas: StackedAreaOptions[] = [{
    xTitle: 'Thresholds', xCategories: [],
    data: { van: [], sim: [], spl: [], per: [] }
  }, {
    xTitle: 'Windows', xCategories: [],
    data: { van: [], sim: [], spl: [], per: [] }
  }];

  constructor(private datasetService: DatasetService) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    ChartUtils.clearChart(this.prColumnChartSliding);
    ChartUtils.clearChart(this.prColumnChartDetected);
    ChartUtils.clearChart(this.ocMessagesChart);
    ChartUtils.clearChart(this.ocPayloadsChart);
  }

  onDatasetChange(event: { dataset: Simulation[], filters: IDatasetFilters }) {
    this.simulations = event.dataset;
    this.filters = event.filters;
    keys(this.loaders).forEach(k => this.loaders[k] = true);
    setTimeout(() => this.datasetService.parseDataset(this.simulations).then(() => {
      setTimeout(() => this.updatePROverall(), 100);
      setTimeout(() => this.updateHeatmaps(), 100);
      setTimeout(() => this.updateCommOverall(), 100);
      setTimeout(() => this.updateStackedAreas(), 100);
    }).catch(e => console.log(e)), 200);
  }

  private updatePROverall() {
    this.updatePRCCSliding();
    this.updatePRCCDetected();
    this.loaders.prOverall = false;
  }

  private updatePRCCSliding() {
    (this.prColumnChartSliding.get('precision') as Highcharts.SeriesObject).setData([
      this.avg(this.simulations.map(s => s.van.precision)),
      this.avg(this.simulations.map(s => s.sim.precision)),
      this.avg(this.simulations.map(s => s.spl.precision)),
      this.avg(this.simulations.map(s => s.per.precision)),
    ]);
    (this.prColumnChartSliding.get('recall') as Highcharts.SeriesObject).setData([
      this.avg(this.simulations.map(s => s.van.recall)),
      this.avg(this.simulations.map(s => s.sim.recall)),
      this.avg(this.simulations.map(s => s.spl.recall)),
      this.avg(this.simulations.map(s => s.per.recall)),
    ]);
  }

  private updatePRCCDetected() {
    const pr_van = this.simulations.map(s => this.prOfDetectedGIs(s.generated, s.van.detected));
    const pr_sim = this.simulations.map(s => this.prOfDetectedGIs(s.generated, s.sim.detected));
    const pr_spl = this.simulations.map(s => this.prOfDetectedGIs(s.generated, s.spl.detected));
    const pr_per = this.simulations.map(s => this.prOfDetectedGIs(s.generated, s.per.detected));
    (this.prColumnChartDetected.get('precision') as Highcharts.SeriesObject).setData([
      this.avg(pr_van.map(e => e[0])),
      this.avg(pr_sim.map(e => e[0])),
      this.avg(pr_spl.map(e => e[0])),
      this.avg(pr_per.map(e => e[0])),
    ]);
    (this.prColumnChartDetected.get('recall') as Highcharts.SeriesObject).setData([
      this.avg(pr_van.map(e => e[1])),
      this.avg(pr_sim.map(e => e[1])),
      this.avg(pr_spl.map(e => e[1])),
      this.avg(pr_per.map(e => e[1])),
    ]);
  }

  private prOfDetectedGIs(generated: GlobalIceberg[], detected: GlobalIceberg[]) {
    const ugen = new Set();
    const udet = new Set();
    generated.forEach(g => ugen.add(g.value));
    detected.forEach(d => udet.add(d.value));
    let tp = 0;
    udet.forEach(e => { if (ugen.has(e)) { tp += 1; } });
    return [tp / Math.max(udet.size, 1), tp / Math.max(ugen.size, 1)];
  }

  private updateHeatmaps() {
    this.heatmaps[0] = this.shiftWindowHeatmaps();
    this.heatmaps[1] = this.windowThresholdHeatmaps();
    this.loaders.prHeatmaps = false;
  }

  private shiftWindowHeatmaps(): HeatmapOptions {
    const options: HeatmapOptions = {
      xTitle: 'Shifts', xCategories: this.filters.shifts.map(e => e.itemName),
      yTitle: 'Windows', yCategories: this.filters.windows.map(e => e.itemName),
      data: { van: [[], []], sim: [[], []], spl: [[], []], per: [[], []] }
    };
    let i = 0;
    this.filters.shifts.forEach(s => {
      let j = 0;
      this.filters.windows.forEach(w => {
        const e = this.datasetService.getShiftWindowPR(s.id, w.id);
        if (e) {
          this.algorithms.forEach(alg => {
            options.data[alg][0].push([i, j, parseFloat(e[alg].precision.toFixed(2))]);
            options.data[alg][1].push([i, j, parseFloat(e[alg].recall.toFixed(2))]);
          });
        }
        j += 1;
      });
      i += 1;
    });
    return options;
  }

  private windowThresholdHeatmaps(): HeatmapOptions {
    const options: HeatmapOptions = {
      xTitle: 'Windows', xCategories: this.filters.windows.map(e => e.itemName),
      yTitle: 'Thresholds', yCategories: this.filters.thresholds.map(e => e.itemName),
      data: { van: [[], []], sim: [[], []], spl: [[], []], per: [[], []] }
    };
    let i = 0;
    this.filters.windows.forEach(w => {
      let j = 0;
      this.filters.thresholds.forEach(t => {
        const e = this.datasetService.getWindowThresholdPR(w.id, t.id);
        if (e) {
          this.algorithms.forEach(alg => {
            options.data[alg][0].push([i, j, parseFloat(e[alg].precision.toFixed(2))]);
            options.data[alg][1].push([i, j, parseFloat(e[alg].recall.toFixed(2))]);
          });
        }
        j += 1;
      });
      i += 1;
    });
    return options;
  }

  private updateCommOverall() {
    const dict = this.datasetService.getCommunication();
    this.messages.forEach(m => {
      const m_data = [];
      const p_data = [];
      this.algorithms.forEach(a => {
        m_data.push(dict[a].weighted.messages[m] * 100);
        p_data.push(dict[a].weighted.payloads[m] * 100);
      });
      (this.ocMessagesChart.get(m) as Highcharts.SeriesObject).setData(m_data);
      (this.ocPayloadsChart.get(m) as Highcharts.SeriesObject).setData(p_data);
    });
    this.loaders.commOverall = false;
  }

  private updateStackedAreas() {
    this.updateCommThresholds();
    this.updateCommWindows();
  }

  private updateCommThresholds() {
    const options: StackedAreaOptions = {
      xTitle: 'Thresholds', xCategories: this.filters.thresholds.map(e => e.itemName),
      data: { van: [], sim: [], spl: [], per: [] }
    };
    this.filters.thresholds.forEach(t => {
      const stats = this.datasetService.getThresholdMessageStats(t.id);
      keys(stats).forEach(k => options.data[k].push(stats[k].weighted));
    });
    this.stackedAreas[0] = options;
    this.loaders.commThresholds = false;
  }

  private updateCommWindows() {
    const options: StackedAreaOptions = {
      xTitle: 'Windows', xCategories: this.filters.windows.map(e => e.itemName),
      data: { van: [], sim: [], spl: [], per: [] }
    };
    this.filters.windows.forEach(w => {
      const stats = this.datasetService.getWindowMessageStats(w.id);
      keys(stats).forEach(k => options.data[k].push(stats[k].weighted));
    });
    this.stackedAreas[1] = options;
    this.loaders.commWindows = false;
  }

  private avg(array: any[]) {
    return parseFloat((array.reduce((a, b) => a + b) / array.length).toFixed(3));
  }
}
