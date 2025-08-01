import { useEffect, useRef, useState } from 'react';
import Sortable from 'sortablejs';

interface Note {
  id: string;
  content: string;
}

export default function NoteListPage() {
  const [notes, setNotes] = useState<Note[]>([
    { id: 'note-1', content: 'Ghi chú 1' },
    { id: 'note-2', content: 'Ghi chú 2' },
  ]);

  const noteListRef = useRef<HTMLDivElement>(null);
  const trashBinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!noteListRef.current || !trashBinRef.current) return;

    const sortable = Sortable.create(noteListRef.current, {
      animation: 150,
      ghostClass: 'dragging',
      handle: '.note-item',
      group: 'notes',
      filter: '.add-note',
      fallbackOnBody: true,

      onStart: () => {
        const trashBin = trashBinRef.current!;
        trashBin.classList.remove('hidden');
        trashBin.classList.add('animate__animated', 'animate__fadeInUp', 'animate__faster');
      },

      onMove: (evt) => {
        return !evt.related?.classList.contains('add-note');
      },

      onEnd: (evt: any) => {
        const trashBin = trashBinRef.current!;
        trashBin.classList.remove('animate__fadeInUp', 'animate__faster');
        trashBin.classList.add('animate__fadeOutDown', 'animate__faster');

        setTimeout(() => {
          trashBin.classList.add('hidden');
          trashBin.classList.remove('animate__animated', 'animate__fadeOutDown', 'animate__faster');
        }, 300);

        const item = evt.item;
        const trashRect = trashBin.getBoundingClientRect();
        const { clientX, clientY } = evt.originalEvent;

        if (
          clientX >= trashRect.left &&
          clientX <= trashRect.right &&
          clientY >= trashRect.top &&
          clientY <= trashRect.bottom
        ) {
          const id = item.getAttribute('data-id');
          if (id) {
            setNotes((prev) => prev.filter((n) => n.id !== id));
          }
        } else {
          // Update vị trí
          const newOrder = Array.from(noteListRef.current!.children)
            .filter((el) => el.classList.contains('note-item'))
            .map((el) => el.getAttribute('data-id')!);

          setNotes((prev) => {
            const idToNote = Object.fromEntries(prev.map((n) => [n.id, n]));
            return newOrder.map((id) => idToNote[id]);
          });
        }
      },
    });

    return () => {
      sortable.destroy();
    };
  }, [notes]);

  return (
    <>
      <div id="note-list" className="flex flex-col gap-4 m-4" ref={noteListRef}>
        {notes.map((note) => (
          <div key={note.id} className="note-item shadow rounded-box" data-id={note.id}>
            <div className="shadow">
              <button className="w-full p-7 font-extrabold opacity-80">{note.content}</button>
            </div>
          </div>
        ))}

        <div className="add-note shadow rounded-box p-6 flex items-center justify-center bg-base-300">
          <button
            className="btn btn-square btn-error text-white font-bold text-xl"
            onClick={() =>
              setNotes((prev) => [...prev, { id: `note-${Date.now()}`, content: `Ghi chú ${prev.length + 1}` }])
            }
          >
            <i className="fa-sharp fa-solid fa-plus"></i>
          </button>
        </div>
      </div>

      <div
        id="trash-bin"
        ref={trashBinRef}
        className="fixed hidden p-4 left-1/2 bottom-14 transform -translate-x-1/2 bg-base-100 shadow rounded-full z-50"
      >
        <i className="fa-solid fa-trash-can text-2xl text-error"></i>
      </div>
    </>
  );
}
