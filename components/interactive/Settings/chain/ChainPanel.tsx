'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { LuPlus, LuCheck, LuDownload, LuPencil, LuTrash2 } from 'react-icons/lu';
import { ChainSelector } from '../../Selectors/ChainSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useInteractiveConfig } from '@/components/interactive/InteractiveConfigContext';
import { useChain } from '../../hooks';
import ChainSteps from './ChainSteps';
export default function ChainPanel({ showCreateDialog, setShowCreateDialog }) {
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const context = useInteractiveConfig();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: chainData, mutate, error } = useChain(searchParams.get('chain') ?? undefined);
  console.log('DATA', chainData);
  console.log('ERROR', error);
  // Initialize newName when renaming starts
  useEffect(() => {
    if (renaming) {
      setNewName(searchParams.get('chain') ?? '');
    }
  }, [renaming, searchParams]);

  const handleDelete = async () => {
    await context.agixt.deleteChain(searchParams.get('chain') ?? '');
    router.push(pathname);
  };

  const handleRename = async () => {
    await context.agixt.renameChain(searchParams.get('chain') ?? '', newName);
    setRenaming(false);
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('chain', newName);
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };

  const handleExportChain = async () => {
    const chainData = await context.agixt.getChain(searchParams.get('chain') ?? '');
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(chainData.steps)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${searchParams.get('chain')}.json`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <>
      <div className='flex items-center space-x-2 mb-4'>
        {renaming ? (
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} className='flex-grow' />
        ) : (
          <ChainSelector value={searchParams.get('chain') ?? ''} />
        )}
        <Button onClick={() => setShowCreateDialog(true)} disabled={renaming || showCreateDialog}>
          <LuPlus className='h-4 w-4' />
        </Button>
        <Button onClick={handleExportChain} disabled={renaming}>
          <LuDownload className='h-4 w-4' />
        </Button>
        {renaming ? (
          <Button onClick={handleRename}>
            <LuCheck className='h-4 w-4' />
          </Button>
        ) : (
          <Button onClick={() => setRenaming(true)}>
            <LuPencil className='h-4 w-4' />
          </Button>
        )}
        <Button onClick={handleDelete} disabled={renaming}>
          <LuTrash2 className='h-4 w-4' />
        </Button>
      </div>
      <div className='mt-4'>
        <ChainSteps />
      </div>
    </>
  );
}
