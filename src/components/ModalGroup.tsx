import React from 'react';
import { MarkdownDoc, EditorSettings, TextStats } from '../types';
import { TableModal } from './TableModal';
import { TemplateModal } from './TemplateModal';
import { SettingsModal } from './SettingsModal';
import { AboutModal } from './AboutModal';
import { HelpGuideModal } from './HelpGuideModal';
import { ShortcutsModal } from './ShortcutsModal';
import { DiffModal } from './DiffModal';
import { BatchConvertModal } from './BatchConvertModal';
import { LogModal } from './LogModal';
import { StatsModal } from './StatsModal';

interface ModalGroupProps {
  // モーダル開閉状態
  isTableModalOpen: boolean;
  setIsTableModalOpen: (v: boolean) => void;
  isTemplateModalOpen: boolean;
  setIsTemplateModalOpen: (v: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (v: boolean) => void;
  isAboutModalOpen: boolean;
  setIsAboutModalOpen: (v: boolean) => void;
  isHelpGuideModalOpen: boolean;
  setIsHelpGuideModalOpen: (v: boolean) => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (v: boolean) => void;
  isDiffModalOpen: boolean;
  setIsDiffModalOpen: (v: boolean) => void;
  isBatchConvertModalOpen: boolean;
  setIsBatchConvertModalOpen: (v: boolean) => void;
  isLogModalOpen: boolean;
  setIsLogModalOpen: (v: boolean) => void;
  isStatsModalOpen: boolean;
  setIsStatsModalOpen: (v: boolean) => void;

  // データ & ハンドラー
  currentDoc: MarkdownDoc;
  previousDoc: MarkdownDoc | null;
  docs: MarkdownDoc[];
  openTabIds: string[];
  settings: EditorSettings;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
  onInsertTable: (tableMarkdown: string) => void;
  onSelectTemplate: (title: string, content: string) => void;
  stats: TextStats;
  isDark?: boolean;
}

/**
 * QuMaEditor の全モーダルダイアログを一括管理・マウントする集約コンポーネント
 */
export const ModalGroup: React.FC<ModalGroupProps> = ({
  isTableModalOpen,
  setIsTableModalOpen,
  isTemplateModalOpen,
  setIsTemplateModalOpen,
  isSettingsModalOpen,
  setIsSettingsModalOpen,
  isAboutModalOpen,
  setIsAboutModalOpen,
  isHelpGuideModalOpen,
  setIsHelpGuideModalOpen,
  isShortcutsModalOpen,
  setIsShortcutsModalOpen,
  isDiffModalOpen,
  setIsDiffModalOpen,
  isBatchConvertModalOpen,
  setIsBatchConvertModalOpen,
  isLogModalOpen,
  setIsLogModalOpen,
  isStatsModalOpen,
  setIsStatsModalOpen,

  currentDoc,
  previousDoc,
  docs,
  openTabIds,
  settings,
  onUpdateSettings,
  onInsertTable,
  onSelectTemplate,
  stats,
  isDark = true,
}) => {
  return (
    <>
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsertTable={onInsertTable}
      />

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={onSelectTemplate}
        isDark={isDark}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onResetData={() => {
          localStorage.clear();
          window.location.reload();
        }}
        isDark={isDark}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        isDark={isDark}
      />

      <HelpGuideModal
        isOpen={isHelpGuideModalOpen}
        onClose={() => setIsHelpGuideModalOpen(false)}
        isDark={isDark}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        isDark={isDark}
      />

      <DiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        activeDoc={currentDoc}
        previousDoc={previousDoc}
        allDocs={docs}
        openTabIds={openTabIds}
        isDark={isDark}
      />

      <BatchConvertModal
        isOpen={isBatchConvertModalOpen}
        onClose={() => setIsBatchConvertModalOpen(false)}
        isDark={isDark}
      />

      <LogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        isDark={isDark}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        doc={currentDoc}
        stats={stats}
        isDark={isDark}
      />
    </>
  );
};
