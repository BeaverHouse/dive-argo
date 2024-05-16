---
sidebar_position: 6
---

# Conclusion

We have briefly learned about Argo so far.  
We built an image with Argo Workflows and then updated the image tag to Helm chart, detect events using Argo Events and trigger workflows, and finally connected chart to Argo CD so that resources are automatically deployed/managed.

## Improvement points

We did quite a lot, but there is some points for improvement.

- As the current service is not open to the public, we generated a manual event using MinIO. In actual use, events would be controlled by connecting directly to git.
- Since it was a test environment, when granting partial permissions, we granted all permissions or reused existing role/cluster role. Security options were also barely set up. you should consider both aspects more in actual use.
- It is also necessary to consider scaling. In particular, using Argo with a general setting is not suitable for large-scale services. I have experienced an issue in production environment that Argo CD crashes when entering a specific UI because there are too many repos and applications registered on Argo CD. In this case, it would be necessary to adjust various options such as resource allocation to Argo, memory allocation, management policies and so on.  
  I haven't experienced such a case either, so I'll just leave one video about it and move on.  
  https://youtu.be/H3T-Nkxdywg

## Infinite possibilities

I mentioned some improvement points earlier, but there's also some advancement possibilities.

- You can open the service to public. We have MetalLB and Ingress NGINX Controller installed, so you can expose the service by adding some items like public networks and domains! Of course, security should be considered seriously.
- In fact, we only set up a multi-node cluster but didn't use it properly. However, it will be possible to maintain an efficient Kubernetes resource in larger scale based on this.
- We implemented CI/CD on here, but Argo can be used in many other cases besides CI/CD. How to use it depends on yours.
- The tools used here can be changed and added as desired.
  - If you want to use a private image repo instead of Docker Hub, you can use [Harbor][harbor].
  - You can also use other platforms like GitLab or private repository services.
  - Even you can change Argo to other one.  
    Depending on the situation, you may use some other powerful tools such as [Apache Airflow][airflow].

## Working with first documentation

At first, I planned to practice alone, summarize privately and end up as usual. But since I decided to make documentation, I finally got here. I realized that it's more difficult than expected, and looking back, it seems like I spent more times thinking of sentences and searching for references than the practice itself. In the future as well, I plan to review the entire content including english translations, to raise the overall quality.  
It is my first documentation project, so there are still many shortcomings. Please understand kindly, and give a lot of feedback if necessary. Thank you.

_2024, HU-Lee._

[harbor]: https://goharbor.io/
[airflow]: https://airflow.apache.org/
