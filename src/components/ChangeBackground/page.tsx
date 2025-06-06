import React, { useState } from "react";
import { Button, Upload, message, Progress } from "antd";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { updateBackground } from "@/redux/modules/bg/reducer";
import { BACKGROUND } from "@/redux/constant";
import { 
  CloudUploadOutlined, 
  PictureOutlined, 
  DeleteOutlined,
  CheckCircleOutlined 
} from "@ant-design/icons";
import "@/components/Login/index.scss";

const ChangeBackground: React.FC = () => {
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentBackground, setCurrentBackground] = useState<string | null>(
    localStorage.getItem(BACKGROUND)
  );

  const beforeUpload = (file: File) => {
    if (file.size / 1024 / 1024 > 1.5) {
      message.error("图片大小超过1.5MB限制，请选择其他图片");
      return Upload.LIST_IGNORE;
    }

    setUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    
    reader.onloadstart = () => {
      setUploadProgress(10);
    };

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 90) + 10;
        setUploadProgress(progress);
      }
    };

    reader.onloadend = () => {
      setUploadProgress(100);
      
      setTimeout(() => {
        if (reader.result) {
          localStorage.setItem(BACKGROUND, reader.result.toString());
          setCurrentBackground(reader.result.toString());
          dispatch(updateBackground());
          message.success("背景图片已更新！");
        }
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    };

    reader.onerror = () => {
      message.error("图片读取失败");
      setUploading(false);
      setUploadProgress(0);
    };

    if (file) {
      reader.readAsDataURL(file);
    }

    return Upload.LIST_IGNORE;
  };

  const clearBackground = () => {
    localStorage.removeItem(BACKGROUND);
    setCurrentBackground(null);
    dispatch(updateBackground());
    message.success("背景已重置为默认");
  };

  return (
    <motion.div
      className="change-background-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "8px"
      }}
    >
      <motion.h4 
        style={{ 
          color: "rgba(255, 255, 255, 0.9)", 
          fontSize: "16px",
          fontWeight: "500",
          margin: "0 0 8px 0",
          textAlign: "center"
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        背景设置
      </motion.h4>

      {/* 当前背景预览 */}
      {currentBackground && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            width: "120px",
            height: "80px",
            borderRadius: "8px",
            overflow: "hidden",
            border: "2px solid rgba(4, 222, 255, 0.3)",
            position: "relative"
          }}
        >
          <img
            src={currentBackground}
            alt="Current Background"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              background: "rgba(0, 0, 0, 0.6)",
              borderRadius: "4px",
              padding: "2px"
            }}
          >
            <CheckCircleOutlined style={{ color: "#04deff", fontSize: "12px" }} />
          </div>
        </motion.div>
      )}

      {/* 上传进度 */}
      {uploading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          style={{ width: "100%", maxWidth: "200px" }}
        >
          <Progress
            percent={uploadProgress}
            size="small"
            strokeColor="#04deff"
            trailColor="rgba(255, 255, 255, 0.1)"
            showInfo={false}
          />
          <p style={{ 
            color: "rgba(255, 255, 255, 0.7)", 
            fontSize: "12px", 
            textAlign: "center",
            margin: "4px 0 0 0" 
          }}>
            正在处理图片...
          </p>
        </motion.div>
      )}

      {/* 上传按钮 */}
      <Upload
        accept="image/*"
        beforeUpload={beforeUpload}
        showUploadList={false}
        disabled={uploading}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            icon={<CloudUploadOutlined />}
            loading={uploading}
            disabled={uploading}
            style={{
              background: "rgba(4, 222, 255, 0.1)",
              border: "1px solid rgba(4, 222, 255, 0.3)",
              color: "#04deff",
              borderRadius: "8px",
              height: "40px",
              padding: "0 20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease"
            }}
          >
            {uploading ? "上传中..." : "选择背景图片"}
          </Button>
        </motion.div>
      </Upload>

      {/* 清除背景按钮 */}
      {currentBackground && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            icon={<DeleteOutlined />}
            onClick={clearBackground}
            size="small"
            style={{
              background: "rgba(255, 99, 99, 0.1)",
              border: "1px solid rgba(255, 99, 99, 0.3)",
              color: "#ff6b6b",
              borderRadius: "6px",
              fontSize: "12px",
              height: "32px",
              backdropFilter: "blur(10px)"
            }}
          >
            重置背景
          </Button>
        </motion.div>
      )}

      <motion.div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: "8px"
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <PictureOutlined style={{ color: "rgba(4, 222, 255, 0.6)", fontSize: "14px" }} />
        <p style={{ 
          color: "rgba(255, 255, 255, 0.6)", 
          fontSize: "12px",
          margin: 0,
          textAlign: "center",
          lineHeight: "1.4"
        }}>
          支持 JPG、PNG 格式，大小不超过 1.5MB
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ChangeBackground;
