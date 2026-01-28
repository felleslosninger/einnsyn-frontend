import {
  FileCodeIcon,
  FileExcelIcon,
  FileIcon,
  FileJpegIcon,
  FilePdfIcon,
  FilePngIcon,
  FileWordIcon,
} from '@navikt/aksel-icons';

export function getFileIcon(format: string | undefined) {
  if (format === undefined) return <FileIcon />;
  switch (format.toLowerCase()) {
    case 'pdf':
      return <FilePdfIcon />;
    case 'doc':
    case 'docx':
    case 'odf':
      return <FileWordIcon />;
    case 'htm':
    case 'html':
    case 'xml':
      return <FileCodeIcon />;
    case 'xls':
    case 'xlsx':
      return <FileExcelIcon />;
    case 'jpg':
    case 'jpeg':
      return <FileJpegIcon />;
    case 'png':
      return <FilePngIcon />;
    default:
      return <FileIcon />;
  }
}
