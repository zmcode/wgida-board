import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { DatasetService } from 'app/services/dataset/dataset.service';
import { Simulation } from 'app/models/simulation.model';
import { keys, merge } from 'lodash';

export interface IDatasetFilters {
  streams: { id: string, itemName: string }[];
  sizes: { id: number, itemName: string }[];
  shifts: { id: number, itemName: string }[];
  windows: { id: number, itemName: string }[];
  thresholds: { id: number, itemName: string }[];
  nodes: { id: number, itemName: string }[];
}

@Component({
  selector: 'app-dataset',
  templateUrl: './dataset.component.html',
  styleUrls: ['./dataset.component.scss']
})
export class DatasetComponent implements OnInit {

  loading: boolean;
  submitted: boolean;
  selectSettings = {};

  simulations: Simulation[];
  selectedSimulations: Simulation[] = [];
  @Output() datasetChange: EventEmitter<{ dataset: Simulation[], filters: IDatasetFilters }> = new EventEmitter();

  available: IDatasetFilters = {
    streams: [],
    sizes: [],
    shifts: [],
    windows: [],
    thresholds: [],
    nodes: [],
  };

  selected: IDatasetFilters = {
    streams: [],
    sizes: [],
    shifts: [],
    windows: [],
    thresholds: [],
    nodes: [],
  };

  constructor(private datasetService: DatasetService) { }

  ngOnInit() {
    this.loading = true;
    this.datasetService.getDataset().subscribe(
      (data: Simulation[]) => {
        this.simulations = data;
        this.simulations.forEach(s => {
          this.addIfAbsent(this.available.streams, s.stream.type, s.stream.type);
          this.addIfAbsent(this.available.sizes, s.stream.size, s.stream.size.toPrecision(2));
          this.addIfAbsent(this.available.shifts, s.stream.shift, s.stream.shift.toPrecision(2));
          this.addIfAbsent(this.available.windows, s.config.window, s.config.window.toPrecision(2));
          this.addIfAbsent(this.available.thresholds, s.config.threshold, s.config.threshold.toString());
          this.addIfAbsent(this.available.nodes, s.config.nodes, s.config.nodes.toString());
        });
        this.selected.streams = this.sortSetReturn(this.available.streams);
        this.selected.sizes = this.sortSetReturn(this.available.sizes);
        this.selected.shifts = this.sortSetReturn(this.available.shifts);
        this.selected.windows = this.sortSetReturn(this.available.windows);
        this.selected.thresholds = this.sortSetReturn(this.available.thresholds);
        this.selected.nodes = this.sortSetReturn(this.available.nodes);
        this.selectedSimulations = this.simulations;
        this.loading = false;
      },
      (error: any) => {
        console.log(error);
      }
    );
    this.selectSettings = {
      text: 'Select Values',
      selectAllText: 'Select All',
      unSelectAllText: 'Deselect All',
      badgeShowLimit: 1,
      classes: 'wgida-select'
    };
  }

  private addIfAbsent(array: any[], v: string|number, label: string) {
    if (!array.some(e => e.id === v)) {
      array.push({ id: v, 'itemName': label });
    }
  }

  private sortSetReturn(array: any[]): any[] {
    const temp = array.sort((a, b) => a.id - b.id);
    array = [...temp];
    return Array.from(array);
  }

  onItemSelect(item: any) {
    this.filterSimulations();
  }
  onItemDeselect(item: any) {
    this.filterSimulations();
  }
  onSelectAll(items: any) {
    this.filterSimulations();
  }
  onDeselectAll(items: any) {
    this.filterSimulations();
  }

  private filterSimulations() {
    this.loading = true;
    this.submitted = false;
    setTimeout(
      () => {
        this.selectedSimulations = this.simulations.filter(s =>
          this.selected.streams.some(e => e.id === s.stream.type) &&
          this.selected.sizes.some(e => e.id === s.stream.size) &&
          this.selected.shifts.some(e => e.id === s.stream.shift) &&
          this.selected.windows.some(e => e.id === s.config.window) &&
          this.selected.thresholds.some(e => e.id === s.config.threshold) &&
          this.selected.nodes.some(e => e.id === s.config.nodes)
        );
        this.loading = false;
      },
      100
    );
  }

  submit(event: any) {
    this.submitted = !this.submitted;
    if (this.submitted) {
      this.selectSettings = merge(this.selectSettings, { badgeShowLimit: 1 });
      keys(this.selected).forEach(e => this.selected[e] = this.sortSetReturn(this.selected[e]));
      this.datasetChange.emit({
        dataset: this.selectedSimulations,
        filters: this.selected
      });
    } else {
      this.selectSettings = merge(this.selectSettings, { badgeShowLimit: 3 });
    }
  }
}
