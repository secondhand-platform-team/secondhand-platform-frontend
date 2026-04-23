import { useCallback, useState } from "react";
import { Modal, Slider, Button, Space } from "antd";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";

interface AvatarCropModalProps {
  open: boolean;
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (croppedBlob: Blob) => void;
}

/** Convert crop area + original image → cropped Blob (circle mask via canvas) */
async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImageBitmap(
    await fetch(imageSrc).then((r) => r.blob())
  );

  const canvas = document.createElement("canvas");
  const size = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;

  // Draw circle clip
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      0.92
    );
  });
}

const AvatarCropModal = ({
  open,
  imageSrc,
  onCancel,
  onConfirm,
}: AvatarCropModalProps) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Cắt ảnh đại diện"
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button type="primary" loading={loading} onClick={handleConfirm}>
            Xác nhận
          </Button>
        </Space>
      }
      width={440}
      destroyOnClose
    >
      {/* Crop area */}
      <div style={{ position: "relative", height: 320, background: "#111" }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Zoom slider */}
      <div style={{ padding: "16px 8px 0" }}>
        <span style={{ fontSize: 12, color: "#888", marginBottom: 4, display: "block" }}>
          Thu phóng
        </span>
        <Slider
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={setZoom}
          tooltip={{ formatter: (v) => `${Math.round((v ?? 1) * 100)}%` }}
        />
      </div>
    </Modal>
  );
};

export default AvatarCropModal;
