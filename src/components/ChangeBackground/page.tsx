import React from "react";
import { message, Upload } from "antd";
import { useDispatch } from "react-redux";
import { updateBackground } from "@/redux/modules/bg/reducer";
import { BACKGROUND } from "@/redux/constant";

const ChangeBackground: React.FC = () => {
  const dispatch = useDispatch();

  const beforeUpload = (file: File) => {
    const reader = new FileReader();
    let couldUpload = true;

    if (file.size / 1024 / 1024 > 1.5) {
      message.error("Image exceeds 1.5MB limit. Please choose another.");
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
    <Upload
      className="bg-upload"
      accept="image/*"
      beforeUpload={beforeUpload}
      showUploadList={false}
    >
      <button className="bg-white hover:bg-gray-100">
        Upload Background Image
      </button>
    </Upload>
  );
};

export default ChangeBackground;
