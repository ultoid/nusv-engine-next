import { useEffect, useState } from 'react';
import type { ProjectBundle, ImportReport, RecentProject } from '../../core/types.js';

export interface UseProjectIOParams {
  api: typeof window.nusvEditor;
  bundle: ProjectBundle | undefined;
  setBundle: (b: ProjectBundle | undefined) => void;
  dirty: boolean;
  setDirty: (d: boolean) => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
  setMessage: (msg: string) => void;
  setModal: (m: any) => void;
  setPast: (p: ProjectBundle[]) => void;
  setFuture: (f: ProjectBundle[]) => void;
  setSelectedMap: (id: string) => void;
  setSelectedEvent: (id: string) => void;
  setEventDraft: (d: string) => void;
  accept: (next: ProjectBundle, status: string) => void;
}

export function useProjectIO({
  api,
  bundle,
  setBundle,
  dirty,
  setDirty,
  busy,
  setBusy,
  setMessage,
  setModal,
  setPast,
  setFuture,
  setSelectedMap,
  setSelectedEvent,
  setEventDraft,
  accept
}: UseProjectIOParams) {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [defaultLocation, setDefaultLocation] = useState<string>('');
  const [report, setReport] = useState<ImportReport>();

  // New Project Form
  const [newTitle, setNewTitle] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [isFolderCustom, setIsFolderCustom] = useState(false);

  // Project Settings Form
  const [settingsTitle, setSettingsTitle] = useState('');
  const [settingsResWidth, setSettingsResWidth] = useState(816);
  const [settingsResHeight, setSettingsResHeight] = useState(624);
  const [settingsStartMap, setSettingsStartMap] = useState('');
  const [settingsStartX, setSettingsStartX] = useState(0);
  const [settingsStartY, setSettingsStartY] = useState(0);
  const [settingsParty, setSettingsParty] = useState<string[]>([]);

  // Unsaved Guard
  const [pendingAction, setPendingAction] = useState<(() => Promise<void> | void) | null>(null);
  const [pendingActionLabel, setPendingActionLabel] = useState('');

  const refreshRecent = () => {
    if (api?.getRecentProjects) {
      api.getRecentProjects().then(items => {
        if (Array.isArray(items)) setRecentProjects(items);
      }).catch(() => {});
    }
    if (api?.getDefaultDirectory) {
      api.getDefaultDirectory().then((dir: string) => {
        if (dir) setDefaultLocation(dir);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    refreshRecent();
  }, [api]);

  const guardDirty = (action: () => Promise<void> | void, label: string) => {
    if (dirty) {
      setPendingAction(() => action);
      setPendingActionLabel(label);
      setModal('unsavedConfirm');
    } else {
      void action();
    }
  };

  const openNewProjectModal = () => {
    setNewTitle('');
    setNewFolder('');
    setNewLocation('');
    setIsFolderCustom(false);
    setModal('newProject');
  };

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    if (!isFolderCustom) {
      const slug = val.toLowerCase().normalize('NFKD').replace(/[^a-z0-9-_]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'project';
      setNewFolder(slug);
    }
  };

  const handleBrowseLocation = async () => {
    if (api?.chooseDirectory) {
      const chosen = await api.chooseDirectory('Pilih lokasi folder proyek baru');
      if (chosen) setNewLocation(chosen);
    }
  };

  const handleCreateProject = async () => {
    if (!newTitle.trim() || !newFolder.trim()) return;
    setBusy(true);
    try {
      const created = await api!.createProject(newTitle.trim(), {
        folderName: newFolder.trim(),
        location: newLocation.trim() || undefined
      });
      if (created) {
        accept(created, `Proyek baru "${created.project.title}" siap.`);
        refreshRecent();
        setModal('none');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleOpenProject = async (targetPath?: string) => {
    setBusy(true);
    try {
      const opened = await api!.openProject(targetPath);
      if (opened) {
        accept(opened, `Proyek "${opened.project.title}" dibuka.`);
        refreshRecent();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleCloseProject = async () => {
    setBusy(true);
    try {
      if (api?.closeProject) await api.closeProject();
      setBundle(undefined);
      setSelectedMap('');
      setSelectedEvent('');
      setEventDraft('{}');
      setPast([]);
      setFuture([]);
      setDirty(false);
      setMessage('Proyek ditutup.');
      refreshRecent();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProject = async (): Promise<boolean> => {
    if (!bundle) return false;
    setBusy(true);
    try {
      await api!.saveProject(bundle);
      setDirty(false);
      setMessage(`Proyek "${bundle.project.title}" berhasil disimpan.`);
      refreshRecent();
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleLaunchPlaytest = async (path: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (api?.launchProjectPlaytest) {
      try {
        await api.launchProjectPlaytest(path);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : String(err));
      }
    } else {
      await handleOpenProject(path);
      void api?.playtest({ debug: true });
    }
  };

  const handleRemoveRecent = async (projectPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (api?.removeRecentProject) {
      const updated = await api.removeRecentProject(projectPath);
      if (Array.isArray(updated)) setRecentProjects(updated);
    }
  };

  const openSettingsModal = () => {
    if (!bundle) return;
    setSettingsTitle(bundle.project.title);
    setSettingsResWidth(bundle.project.logicalResolution.width);
    setSettingsResHeight(bundle.project.logicalResolution.height);
    setSettingsStartMap(bundle.project.start.mapId);
    setSettingsStartX(bundle.project.start.x);
    setSettingsStartY(bundle.project.start.y);
    setSettingsParty(bundle.project.party ?? []);
    setModal('projectSettings');
  };

  const handleApplySettings = () => {
    if (!bundle) return;
    const next: ProjectBundle = {
      ...bundle,
      project: {
        ...bundle.project,
        title: settingsTitle.trim() || bundle.project.title,
        logicalResolution: {
          width: settingsResWidth,
          height: settingsResHeight
        },
        start: {
          ...bundle.project.start,
          mapId: settingsStartMap || bundle.project.start.mapId,
          x: settingsStartX,
          y: settingsStartY
        },
        party: settingsParty.length > 0 ? settingsParty : bundle.project.party
      }
    };
    setBundle(next);
    setDirty(true);
    setMessage('Pengaturan proyek berhasil diperbarui.');
    setModal('none');
  };

  const importMv = async () => {
    if (!bundle || !api?.importMvSubset) return;
    setBusy(true);
    try {
      const result = await api.importMvSubset(bundle);
      if (result) {
        accept(result.bundle, `Imported ${result.report.source} with ${result.report.converted.length} conversions.`);
        setReport(result.report);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return {
    recentProjects,
    defaultLocation,
    report,
    newTitle,
    newFolder,
    newLocation,
    isFolderCustom,
    setNewFolder,
    setIsFolderCustom,
    setNewLocation,
    settingsTitle,
    settingsResWidth,
    settingsResHeight,
    settingsStartMap,
    settingsStartX,
    settingsStartY,
    settingsParty,
    setSettingsTitle,
    setSettingsResWidth,
    setSettingsResHeight,
    setSettingsStartMap,
    setSettingsStartX,
    setSettingsStartY,
    setSettingsParty,
    pendingAction,
    pendingActionLabel,
    setPendingAction,
    guardDirty,
    openNewProjectModal,
    openSettingsModal,
    handleTitleChange,
    handleBrowseLocation,
    handleCreateProject,
    handleOpenProject,
    handleCloseProject,
    handleSaveProject,
    handleLaunchPlaytest,
    handleRemoveRecent,
    handleApplySettings,
    refreshRecent,
    importMv
  };
}
