import { appImages } from '~/assets';

export default function NavBar() {
  return (
    <div className="navbar min-h-0 p-3 bg-base-100">
      <div className="flex-none">
        <img src={appImages.logos.app} className="w-7 h-7" />
      </div>
      <div className="flex-1">
        <a id="app-title" className="font-extrabold ps-1 text-xl text-base-content">
          SpendWise
        </a>
      </div>
      <div className="flex-none">
        <i className="text-xl fa-regular fa-bell"></i>
      </div>
    </div>
  );
}
