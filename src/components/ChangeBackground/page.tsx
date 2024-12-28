import React from "react";
import { Button, Upload } from "antd";
import { useDispatch } from "react-redux";
import { updateBackground } from "@/redux/modules/bg/reducer";
import { BACKGROUND } from "@/redux/constant";
import "@/components/Login/index.scss";

const ChangeBackground: React.FC = () => {
  const dispatch = useDispatch();

  const beforeUpload = (file: File) => {
    const reader = new FileReader();
    let couldUpload = true;

    if (file.size / 1024 / 1024 > 1.5) {
      alert("Image exceeds 1.5MB limit. Please choose another.");
      couldUpload = false;
      return Upload.LIST_IGNORE;
    }

    reader.onloadend = () => {
      if (couldUpload && reader.result) {
        localStorage.setItem(BACKGROUND, reader.result.toString());
        dispatch(updateBackground());
      }
    };

    if (file) {
      reader.readAsDataURL(file);
    }

    return Upload.LIST_IGNORE;
  };

  return (
    <div className="flex flex-col items-center my-4">
      <span>Change BackGround</span>
      <Upload
        className="bg-upload"
        accept="image/*"
        beforeUpload={beforeUpload}
        showUploadList={false}
      >
        <Button
          className="Lbutton"
          style={{ width: "20rem" }}
        >
          Upload Background Image
        </Button>
      </Upload>
    </div>
  );
};

export default ChangeBackground;
