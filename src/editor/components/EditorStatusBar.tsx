import React from 'react';
import type { LayerSelection } from '../../core/map-layers.js';
import type { MapData, ProjectBundle } from '../../core/types.js';
import type { PaletteBlockSelection } from './MapPaletteCanvas.js';

export interface EditorStatusBarProps {
  bundle: ProjectBundle;
  map?: MapData;
  zoom: number;
  activeLayer: LayerSelection;
  isShiftPressed: boolean;
  selectedBlock: PaletteBlockSelection;
  errorCount: number;
  dirty: boolean;
  message: string;
}

export function EditorStatusBar({
  bundle,
  map,
  zoom,
  activeLayer,
  isShiftPressed,
  selectedBlock,
  errorCount,
  dirty,
  message
}: EditorStatusBarProps) {
  return (
    <footer className="mz-statusbar" role="status">
      <div className="mz-status-cell mz-status-map">
        {map ? `${String(bundle.project.maps.indexOf(map.id) + 1).padStart(3, '0')}:${map.name} (${map.width}x${map.height})` : '001:MAP001 (17x13)'}
      </div>
      <div className="mz-status-cell mz-status-zoom">
        {zoom}%
      </div>
      <div className="mz-status-cell mz-status-layer">
        {activeLayer === 'auto' ? 'Automatic' : `Layer ${activeLayer + 1}`}
        {isShiftPressed && <span className="mz-shift-indicator" title="Shift Mapping: Autotile dikunci tanpa mengubah tile sekitar"> [SHIFT]</span>}
        {(selectedBlock.width > 1 || selectedBlock.height > 1) && (
          <span className="mz-status-block-badge" title={`Blok seleksi: ${selectedBlock.width} x ${selectedBlock.height} tiles`}>
            {` [BLOK ${selectedBlock.width}x${selectedBlock.height}]`}
          </span>
        )}
      </div>
      <div id="mz-status-coord-display" className="mz-status-cell mz-status-coord" />
      <div className="mz-status-cell mz-status-msg">
        <span className={`mv-status-light ${errorCount ? 'error' : dirty ? 'dirty' : ''}`} />
        <span>{message}</span>
      </div>
    </footer>
  );
}
