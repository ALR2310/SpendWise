import Sortable from 'sortablejs';
import $ from 'jquery';

const noteList = $('#note-list')[0];
const trashBin = $('#trash-bin');

Sortable.create(noteList, {
  animation: 150,
  ghostClass: 'dragging',
  handle: '.note-item',
  group: 'notes',
  filter: '.add-note',
  fallbackOnBody: true,
  onStart: () => {
    trashBin.removeClass('hidden');
    trashBin.addClass('animate__animated animate__fadeInUp animate__faster');
  },
  onMove: (evt) => {
    return !evt.related.classList.contains('add-note');
  },
  onEnd: (evt) => {
    trashBin.removeClass('animate__fadeInUp animate__faster');
    trashBin.addClass('animate__fadeOutDown animate__faster');

    setTimeout(() => {
      trashBin.addClass('hidden');
      trashBin.removeClass('animate__animated animate__fadeOutDown animate__faster');
    }, 300);

    const item = evt.item;
    const trashRect = trashBin[0].getBoundingClientRect();
    // @ts-ignore
    const { clientX, clientY } = evt.originalEvent;

    if (
      clientX >= trashRect.left &&
      clientX <= trashRect.right &&
      clientY >= trashRect.top &&
      clientY <= trashRect.bottom
    ) {
      item.remove();
    }
  },
});

export {};
