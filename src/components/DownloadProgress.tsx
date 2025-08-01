export default function DownloadProgress() {
  return (
    <div className="w-full fixed bottom-[50px] p-2">
      <progress className="progress h-[3px] hidden" value="50" max="100"></progress>
    </div>
  );
}
