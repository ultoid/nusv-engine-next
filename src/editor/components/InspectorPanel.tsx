import React from 'react';
import type { LayerSelection } from '../../core/map-layers.js';
import type { MapData, MapEvent, ProjectBundle } from '../../core/types.js';

export interface InspectorPanelProps {
  bundle?: ProjectBundle;
  map?: MapData;
  currentEvent?: MapEvent;
  activeLayer: LayerSelection;
  setActiveLayer: (l: LayerSelection) => void;
  visibleLayers: boolean[];
  setVisibleLayers: React.Dispatch<React.SetStateAction<boolean[]>>;
  lockedLayers: boolean[];
  setLockedLayers: React.Dispatch<React.SetStateAction<boolean[]>>;
  clearLayer: (index: number) => void;
  errorCount: number;
  warningCount: number;
  diagnostics: Array<{ severity: 'error' | 'warning'; message: string; path: string }>;
  setMode: (m: 'map' | 'event' | 'search') => void;
}

export function InspectorPanel({
  bundle,
  map,
  currentEvent,
  activeLayer,
  setActiveLayer,
  visibleLayers,
  setVisibleLayers,
  lockedLayers,
  setLockedLayers,
  clearLayer,
  errorCount,
  warningCount,
  diagnostics,
  setMode
}: InspectorPanelProps) {
  return (
    <aside className="mv-sidebar mv-inspector">
      <div className="mv-pane-title"><strong>Inspector</strong><span>Properties</span></div>
      {bundle && map ? (
        <div className="mv-inspector-content">
          <section>
            <h3>Project</h3>
            <dl>
              <dt>Title</dt>
              <dd>{bundle.project.title}</dd>
              <dt>Project ID</dt>
              <dd title={bundle.project.projectId}>{bundle.project.projectId}</dd>
              <dt>Resolution</dt>
              <dd>{bundle.project.logicalResolution.width} × {bundle.project.logicalResolution.height}</dd>
            </dl>
          </section>

          <section>
            <h3>Map Properties</h3>
            <dl>
              <dt>Name</dt>
              <dd>{map.name}</dd>
              <dt>ID</dt>
              <dd title={map.id}>{map.id}</dd>
              <dt>Size</dt>
              <dd>{map.width} × {map.height}</dd>
              <dt>Tile Size</dt>
              <dd>{map.tileSize}px</dd>
              <dt>Events</dt>
              <dd>{map.events.length}</dd>
            </dl>
          </section>

          <section className="mv-layer-inspector">
            <h3>Map Layers <button onClick={() => setActiveLayer('auto')}>Auto</button></h3>
            {map.layers.map((layer, index) => (
              <div className={activeLayer === index ? 'active' : ''} key={layer.id}>
                <button className="layer-name" onClick={() => setActiveLayer(index as 0 | 1 | 2 | 3)}>
                  <b>{index + 1}</b>
                  <span>{layer.name}</span>
                  <small>{layer.data.filter(Boolean).length} tiles</small>
                </button>
                <button
                  className={visibleLayers[index] ? 'enabled' : ''}
                  title={visibleLayers[index] ? 'Hide layer' : 'Show layer'}
                  onClick={() => setVisibleLayers(values => values.map((value, i) => i === index ? !value : value))}
                >
                  {visibleLayers[index] ? '◉' : '○'}
                </button>
                <button
                  className={lockedLayers[index] ? 'enabled' : ''}
                  title={lockedLayers[index] ? 'Unlock layer' : 'Lock layer'}
                  onClick={() => setLockedLayers(values => values.map((value, i) => i === index ? !value : value))}
                >
                  {lockedLayers[index] ? '▣' : '□'}
                </button>
                <button
                  title="Clear layer"
                  disabled={lockedLayers[index] || !layer.data.some(Boolean)}
                  onClick={() => clearLayer(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </section>

          {currentEvent && (
            <section className="mv-event-properties">
              <h3>Selected Event</h3>
              <dl>
                <dt>Name</dt>
                <dd>{currentEvent.name}</dd>
                <dt>Position</dt>
                <dd>{currentEvent.x}, {currentEvent.y}</dd>
                <dt>Trigger</dt>
                <dd>{currentEvent.trigger}</dd>
                <dt>Pages</dt>
                <dd>{currentEvent.pages.length}</dd>
              </dl>
              <button onClick={() => setMode('event')}>Open Event Editor</button>
            </section>
          )}

          <section className="mv-validation">
            <h3>Validation <button onClick={() => setMode('search')}>Search</button></h3>
            <div className="mv-validation-summary">
              <span className={errorCount ? 'bad' : 'good'}><b>{errorCount}</b> errors</span>
              <span className={warningCount ? 'warn' : 'good'}><b>{warningCount}</b> warnings</span>
            </div>
            {diagnostics.slice(0, 5).map((issue, index) => (
              <article className={issue.severity} key={`${issue.path}-${index}`}>
                <b>{issue.message}</b>
                <small>{issue.path}</small>
              </article>
            ))}
            {!diagnostics.length && <p className="mv-valid">✓ Project references are valid</p>}
          </section>
        </div>
      ) : (
        <div className="mv-empty-pane">
          <span>ⓘ</span>
          <p>Open a project to inspect its properties.</p>
        </div>
      )}
    </aside>
  );
}
