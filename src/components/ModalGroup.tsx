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
import { RevisionHistoryModal } from './RevisionHistoryModal';

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
  isRevisionHistoryOpen: boolean;
  setIsRevisionHistoryOpen: (v: boolean) => void;
  onRestoreContent?: (newContent: string) => void;

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
  isRevisionHistoryOpen,
  setIsRevisionHistoryOpen,
  onRestoreContent,

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
      {isTableModalOpen && (
        <TableModal
          isOpen={isTableModalOpen}
          onClose={() => setIsTableModalOpen(false)}
          onInsertTable={onInsertTable}
        />
      )}

      {isTemplateModalOpen && (
        <TemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onSelectTemplate={onSelectTemplate}
          currentDoc={currentDoc}
          isDark={isDark}
        />
      )}

      {isSettingsModalOpen && (
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
      )}

      {isAboutModalOpen && (
        <AboutModal
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
          isDark={isDark}
        />
      )}

      {isHelpGuideModalOpen && (
        <HelpGuideModal
          isOpen={isHelpGuideModalOpen}
          onClose={() => setIsHelpGuideModalOpen(false)}
          isDark={isDark}
        />
      )}

      {isShortcutsModalOpen && (
        <ShortcutsModal
          isOpen={isShortcutsModalOpen}
          onClose={() => setIsShortcutsModalOpen(false)}
          isDark={isDark}
        />
      )}

      {isDiffModalOpen && (
        <DiffModal
          isOpen={isDiffModalOpen}
          onClose={() => setIsDiffModalOpen(false)}
          activeDoc={currentDoc}
          previousDoc={previousDoc}
          allDocs={docs}
          openTabIds={openTabIds}
          isDark={isDark}
        />
      )}

      {isBatchConvertModalOpen && (
        <BatchConvertModal
          isOpen={isBatchConvertModalOpen}
          onClose={() => setIsBatchConvertModalOpen(false)}
          isDark={isDark}
        />
      )}

      {isLogModalOpen && (
        <LogModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          isDark={isDark}
        />
      )}

      {isStatsModalOpen && (
        <StatsModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          doc={currentDoc}
          stats={stats}
          isDark={isDark}
        />
      )}

      {isRevisionHistoryOpen && (
        <RevisionHistoryModal
          isOpen={isRevisionHistoryOpen}
          onClose={() => setIsRevisionHistoryOpen(false)}
          currentDoc={currentDoc}
          onRestoreContent={onRestoreContent || (() => {})}
          isDark={isDark}
        />
      )}
    </>
  );
};
