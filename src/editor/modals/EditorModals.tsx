import React from 'react';
import type { MapEvent, ProjectBundle, TilesetData } from '../../core/types.js';
import { DatabaseView, type DatabaseCollection } from '../DatabaseView.js';
import type { useEventEditor } from '../hooks/useEventEditor.js';
import type { useMapOperations } from '../hooks/useMapOperations.js';
import type { useProjectIO } from '../hooks/useProjectIO.js';
import { ResourceManagerModal } from '../ResourceManagerModal.js';
import { DungeonGeneratorModal } from './DungeonGeneratorModal.js';
import { EventEditorModal } from './EventEditorModal.js';
import { MapPropertiesModal } from './MapPropertiesModal.js';
import { NewProjectModal } from './NewProjectModal.js';
import { ProjectSettingsModal } from './ProjectSettingsModal.js';
import { QuickChestModal, QuickDoorModal, QuickInnModal, QuickTransferModal } from './QuickEventModals.js';
import { SampleMapsModal } from './SampleMapsModal.js';
import { ShiftMapModal } from './ShiftMapModal.js';
import { SoundTestModal } from './SoundTestModal.js';
import { UnsavedConfirmModal } from './UnsavedConfirmModal.js';

export interface EditorModalsProps {
  modal: string;
  setModal: (m: any) => void;
  bundle?: ProjectBundle;
  projectIO: ReturnType<typeof useProjectIO>;
  eventEditor: ReturnType<typeof useEventEditor>;
  mapOps: ReturnType<typeof useMapOperations>;
  currentTileset: TilesetData;
  currentEvent?: MapEvent;
  placeholderTitle: string;
  placeholderDesc: string;
  collection: DatabaseCollection;
  setCollection: (c: DatabaseCollection) => void;
  commit: (next: ProjectBundle, status?: string) => void;
  assetUrls: Record<string, string>;
  setMessage: (msg: string) => void;
  soundCategory: 'se' | 'me' | 'bgm';
  soundSelected: string;
  setSoundCategory: (cat: 'se' | 'me' | 'bgm') => void;
  setSoundSelected: (s: string) => void;
  playSoundEffect: (name: string) => void;
}

export function EditorModals({
  modal,
  setModal,
  bundle,
  projectIO,
  eventEditor,
  mapOps,
  currentTileset,
  currentEvent,
  placeholderTitle,
  placeholderDesc,
  collection,
  setCollection,
  commit,
  assetUrls,
  setMessage,
  soundCategory,
  soundSelected,
  setSoundCategory,
  setSoundSelected,
  playSoundEffect
}: EditorModalsProps) {
  if (modal === 'none') return null;

  return (
    <>
      {modal === 'newProject' && (
        <NewProjectModal
          newTitle={projectIO.newTitle}
          newFolder={projectIO.newFolder}
          newLocation={projectIO.newLocation}
          defaultLocation={projectIO.defaultLocation}
          busy={false}
          onTitleChange={projectIO.handleTitleChange}
          onFolderChange={projectIO.setNewFolder}
          onLocationChange={projectIO.setNewLocation}
          onBrowseLocation={projectIO.handleBrowseLocation}
          onCreateProject={projectIO.handleCreateProject}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'projectSettings' && bundle && (
        <ProjectSettingsModal
          bundle={bundle}
          settingsTitle={projectIO.settingsTitle}
          settingsResWidth={projectIO.settingsResWidth}
          settingsResHeight={projectIO.settingsResHeight}
          settingsStartMap={projectIO.settingsStartMap}
          settingsStartX={projectIO.settingsStartX}
          settingsStartY={projectIO.settingsStartY}
          settingsParty={projectIO.settingsParty}
          onTitleChange={projectIO.setSettingsTitle}
          onResChange={(w, h) => {
            projectIO.setSettingsResWidth(w);
            projectIO.setSettingsResHeight(h);
          }}
          onStartMapChange={projectIO.setSettingsStartMap}
          onStartXChange={projectIO.setSettingsStartX}
          onStartYChange={projectIO.setSettingsStartY}
          onTogglePartyMember={(id, checked) => {
            projectIO.setSettingsParty(prev =>
              checked ? [...prev, id] : prev.filter(m => m !== id)
            );
          }}
          onApply={projectIO.handleApplySettings}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'unsavedConfirm' && (
        <UnsavedConfirmModal
          pendingActionLabel={projectIO.pendingActionLabel}
          onSaveAndContinue={async () => {
            await projectIO.handleSaveProject();
            const action = projectIO.pendingAction;
            setModal('none');
            projectIO.setPendingAction(null);
            if (action) await action();
          }}
          onDiscard={async () => {
            const action = projectIO.pendingAction;
            setModal('none');
            projectIO.setPendingAction(null);
            if (action) await action();
          }}
          onCancel={() => {
            setModal('none');
            projectIO.setPendingAction(null);
          }}
        />
      )}

      {modal === 'eventEditor' && bundle && (currentEvent || eventEditor.parsedEvent) && (
        <EventEditorModal
          bundle={bundle}
          currentEvent={(currentEvent || eventEditor.parsedEvent)!}
          eventPage={eventEditor.eventPage}
          setEventPage={eventEditor.setEventPage}
          eventView={eventEditor.eventView}
          setEventView={eventEditor.setEventView}
          eventDraft={eventEditor.eventDraft}
          setEventDraft={eventEditor.setEventDraft}
          characterOptions={eventEditor.characterOptions}
          selectedCommandIndex={eventEditor.selectedCommandIndex}
          setSelectedCommandIndex={eventEditor.setSelectedCommandIndex}
          copiedPage={eventEditor.copiedPage}
          newCommandType={eventEditor.newCommandType}
          setNewCommandType={eventEditor.setNewCommandType}
          updateEventVisual={eventEditor.updateEventVisual}
          updateCurrentPage={eventEditor.updateCurrentPage}
          handleNewPage={eventEditor.handleNewPage}
          handleDeletePage={eventEditor.handleDeletePage}
          handleCopyPage={eventEditor.handleCopyPage}
          handlePastePage={eventEditor.handlePastePage}
          copyEvent={eventEditor.copyEvent}
          addCommand={eventEditor.addCommand}
          addCommandAt={eventEditor.addCommandAt}
          moveCommand={eventEditor.moveCommand}
          removeCommand={eventEditor.removeCommand}
          updateCommand={eventEditor.updateCommand}
          applyEvent={eventEditor.applyEvent}
          assetUrls={assetUrls}
          onClose={eventEditor.cancelEvent}
        />
      )}

      {modal === 'mapProperties' && bundle && (
        <MapPropertiesModal
          bundle={bundle}
          currentTileset={currentTileset}
          mapEditName={mapOps.mapEditName}
          mapEditDisplayName={mapOps.mapEditDisplayName}
          mapEditWidth={mapOps.mapEditWidth}
          mapEditHeight={mapOps.mapEditHeight}
          mapEditTilesetId={mapOps.mapEditTilesetId}
          mapEditScroll={mapOps.mapEditScroll}
          mapEditBgm={mapOps.mapEditBgm}
          mapEditParallaxName={mapOps.mapEditParallaxName}
          mapEditParallaxLoopX={mapOps.mapEditParallaxLoopX}
          mapEditParallaxLoopY={mapOps.mapEditParallaxLoopY}
          mapEditParallaxSx={mapOps.mapEditParallaxSx}
          mapEditParallaxSy={mapOps.mapEditParallaxSy}
          mapEditBattleback1={mapOps.mapEditBattleback1}
          mapEditBattleback2={mapOps.mapEditBattleback2}
          mapEditEncounterStep={mapOps.mapEditEncounterStep}
          mapEditDisableDash={mapOps.mapEditDisableDash}
          mapEditNote={mapOps.mapEditNote}
          setMapEditName={mapOps.setMapEditName}
          setMapEditDisplayName={mapOps.setMapEditDisplayName}
          setMapEditWidth={mapOps.setMapEditWidth}
          setMapEditHeight={mapOps.setMapEditHeight}
          setMapEditTilesetId={mapOps.setMapEditTilesetId}
          setMapEditScroll={mapOps.setMapEditScroll}
          setMapEditBgm={mapOps.setMapEditBgm}
          setMapEditParallaxName={mapOps.setMapEditParallaxName}
          setMapEditParallaxLoopX={mapOps.setMapEditParallaxLoopX}
          setMapEditParallaxLoopY={mapOps.setMapEditParallaxLoopY}
          setMapEditParallaxSx={mapOps.setMapEditParallaxSx}
          setMapEditParallaxSy={mapOps.setMapEditParallaxSy}
          setMapEditBattleback1={mapOps.setMapEditBattleback1}
          setMapEditBattleback2={mapOps.setMapEditBattleback2}
          setMapEditEncounterStep={mapOps.setMapEditEncounterStep}
          setMapEditDisableDash={mapOps.setMapEditDisableDash}
          setMapEditNote={mapOps.setMapEditNote}
          onApply={mapOps.handleApplyMapProperties}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'sampleMaps' && (
        <SampleMapsModal
          selectedSampleMap={mapOps.selectedSampleMap}
          onSelectSampleMap={mapOps.setSelectedSampleMap}
          onApply={mapOps.handleApplySampleMap}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'toolPlaceholder' && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal-card mz-style" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="mv-modal-header">
              <span className="mz-dialog-icon">⚙</span>
              <h3 className="mz-dialog-title">{placeholderTitle}</h3>
              <button className="mz-dialog-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mz-dialog-body" style={{ padding: '16px 20px', fontSize: 13, color: 'var(--mz-text)' }}>
              <p>{placeholderDesc}</p>
            </div>
            <div className="mz-dialog-footer">
              <button className="mz-btn mz-btn-primary" onClick={() => setModal('none')}>OK</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'database' && bundle && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div
            className="mv-modal-card mz-style"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', width: 1200, height: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="mv-modal-header">
              <span className="mz-dialog-icon">▤</span>
              <h3 className="mz-dialog-title">Database</h3>
              <button className="mz-dialog-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <DatabaseView
                bundle={bundle}
                collection={collection}
                onSelectCollection={setCollection}
                onCommit={commit}
                onImportMv={() => void projectIO.importMv()}
                assetUrls={assetUrls}
              />
            </div>
          </div>
        </div>
      )}

      {modal === 'resourceManager' && bundle && (
        <ResourceManagerModal
          bundle={bundle}
          onCommit={commit}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'shiftMap' && (
        <ShiftMapModal
          shiftX={mapOps.shiftX}
          shiftY={mapOps.shiftY}
          shiftLoop={mapOps.shiftLoop}
          onShiftXChange={mapOps.setShiftX}
          onShiftYChange={mapOps.setShiftY}
          onShiftLoopChange={mapOps.setShiftLoop}
          onApply={mapOps.handleApplyShiftModal}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'generateDungeon' && (
        <DungeonGeneratorModal
          dungeonFloor={mapOps.dungeonFloor}
          dungeonWall={mapOps.dungeonWall}
          onFloorChange={mapOps.setDungeonFloor}
          onWallChange={mapOps.setDungeonWall}
          onApply={mapOps.handleApplyGenerateDungeon}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'soundTest' && (
        <SoundTestModal
          soundCategory={soundCategory}
          soundSelected={soundSelected}
          onCategoryChange={setSoundCategory}
          onSelectSound={setSoundSelected}
          onPlaySound={playSoundEffect}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'quickTransfer' && bundle && (
        <QuickTransferModal
          bundle={bundle}
          quickTargetMap={mapOps.quickTargetMap}
          quickTargetX={mapOps.quickTargetX}
          quickTargetY={mapOps.quickTargetY}
          onTargetMapChange={mapOps.setQuickTargetMap}
          onTargetXChange={mapOps.setQuickTargetX}
          onTargetYChange={mapOps.setQuickTargetY}
          onCreate={mapOps.handleCreateQuickTransfer}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'quickDoor' && bundle && (
        <QuickDoorModal
          bundle={bundle}
          quickTargetMap={mapOps.quickTargetMap}
          quickTargetX={mapOps.quickTargetX}
          quickTargetY={mapOps.quickTargetY}
          onTargetMapChange={mapOps.setQuickTargetMap}
          onTargetXChange={mapOps.setQuickTargetX}
          onTargetYChange={mapOps.setQuickTargetY}
          onCreate={mapOps.handleCreateQuickDoor}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'quickChest' && bundle && (
        <QuickChestModal
          bundle={bundle}
          quickChestType={mapOps.quickChestType}
          quickChestAmount={mapOps.quickChestAmount}
          quickChestItem={mapOps.quickChestItem}
          onChestTypeChange={mapOps.setQuickChestType}
          onChestAmountChange={mapOps.setQuickChestAmount}
          onChestItemChange={mapOps.setQuickChestItem}
          onCreate={mapOps.handleCreateQuickChest}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'quickInn' && (
        <QuickInnModal
          quickInnPrice={mapOps.quickInnPrice}
          onPriceChange={mapOps.setQuickInnPrice}
          onCreate={mapOps.handleCreateQuickInn}
          onClose={() => setModal('none')}
        />
      )}
    </>
  );
}
