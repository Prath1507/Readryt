import os
import glob
import joblib

from skimage.io import imread
from skimage.color import rgb2gray
from skimage.transform import resize
from skimage.feature import hog

from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix


BASE_FOLDER = r"E:\readryt\ReadRyt\training-data\recognition\rupee-detector"

POSITIVE_FOLDER = os.path.join(
    BASE_FOLDER,
    "positive"
)

NEGATIVE_FOLDER = os.path.join(
    BASE_FOLDER,
    "negative"
)

MODEL_FOLDER = os.path.join(
    BASE_FOLDER,
    "model"
)

MODEL_FILE = os.path.join(
    MODEL_FOLDER,
    "rupee_detector.joblib"
)


IMAGE_SIZE = (96, 64)


def extract_features(image_path):
    image = imread(image_path)

    # Convert RGB/RGBA to grayscale.
    if image.ndim == 3:
        image = rgb2gray(image)

    # Normalize every sample to the same size.
    image = resize(
        image,
        IMAGE_SIZE,
        anti_aliasing=True
    )

    # HOG captures the shape/edges of the symbol.
    features = hog(
        image,
        orientations=9,
        pixels_per_cell=(8, 8),
        cells_per_block=(2, 2),
        block_norm="L2-Hys"
    )

    return features


def load_dataset():

    features = []
    labels = []

    positive_files = glob.glob(
        os.path.join(
            POSITIVE_FOLDER,
            "*.jpg"
        )
    )

    negative_files = glob.glob(
        os.path.join(
            NEGATIVE_FOLDER,
            "*.jpg"
        )
    )

    print(
        f"Positive images found: {len(positive_files)}"
    )

    print(
        f"Negative images found: {len(negative_files)}"
    )

    for image_path in positive_files:

        try:
            features.append(
                extract_features(image_path)
            )

            labels.append(1)

        except Exception as error:
            print(
                f"Failed positive image: "
                f"{image_path}"
            )

            print(error)

    for image_path in negative_files:

        try:
            features.append(
                extract_features(image_path)
            )

            labels.append(0)

        except Exception as error:
            print(
                f"Failed negative image: "
                f"{image_path}"
            )

            print(error)

    return features, labels


def main():

    os.makedirs(
        MODEL_FOLDER,
        exist_ok=True
    )

    print(
        "Loading ₹ detector dataset..."
    )

    features, labels = load_dataset()

    print()
    print(
        f"Total samples: {len(features)}"
    )

    if len(features) < 20:
        print(
            "Not enough training samples."
        )

        return

    X_train, X_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=0.25,
        random_state=42,
        stratify=labels
    )

    print(
        f"Training samples: {len(X_train)}"
    )

    print(
        f"Testing samples: {len(X_test)}"
    )

    print()
    print(
        "Training classifier..."
    )

    model = make_pipeline(
        StandardScaler(),
        SVC(
            kernel="rbf",
            C=10,
            probability=True,
            class_weight="balanced",
            random_state=42
        )
    )

    model.fit(
        X_train,
        y_train
    )

    print(
        "Training completed."
    )

    predictions = model.predict(
        X_test
    )

    print()
    print(
        "Classification report:"
    )

    print(
        classification_report(
            y_test,
            predictions,
            target_names=[
                "Not ₹",
                "₹"
            ]
        )
    )

    print(
        "Confusion matrix:"
    )

    print(
        confusion_matrix(
            y_test,
            predictions
        )
    )

    joblib.dump(
        model,
        MODEL_FILE
    )

    print()
    print(
        "Model saved:"
    )

    print(
        MODEL_FILE
    )


if __name__ == "__main__":
    main()